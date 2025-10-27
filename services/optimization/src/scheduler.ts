import { EventEmitter } from 'events';
import { OptimizationRunner } from './runner.js';
import { prometheus } from './metrics.js';

export class OptimizationScheduler extends EventEmitter {
  private maxConcurrent: number;
  private queue: Array<{
    id: string;
    strategy: string;
    paramSpace: any;
    budget: number;
    priority: number;
  }> = [];
  private running: Map<string, OptimizationRunner> = new Map();
  private completed: Map<string, any> = new Map();

  constructor(options: { maxConcurrent?: number } = {}) {
    super();
    this.maxConcurrent = options.maxConcurrent || 4;
  }

  async schedule(
    id: string,
    strategy: string,
    paramSpace: any,
    budget: number,
    priority: number = 0
  ) {
    const job = {
      id,
      strategy,
      paramSpace,
      budget,
      priority
    };

    // Add to queue
    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);

    this.emit('jobQueued', job);
    await this.processQueue();
  }

  private async processQueue() {
    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const job = this.queue.shift();
      if (!job) break;

      await this.startJob(job);
    }
  }

  private async startJob(job: any) {
    const runner = new OptimizationRunner(
      job.strategy,
      job.paramSpace,
      {
        maxEvaluations: job.budget,
        earlyStopPlateau: 10
      }
    );

    this.running.set(job.id, runner);

    runner.on('evaluation', (data) => {
      this.emit('evaluation', { jobId: job.id, ...data });
    });

    runner.on('completed', (data) => {
      this.completed.set(job.id, data);
      this.running.delete(job.id);
      this.emit('jobCompleted', { jobId: job.id, ...data });
      this.processQueue(); // Process next job
    });

    runner.on('error', (error) => {
      this.running.delete(job.id);
      this.emit('jobError', { jobId: job.id, error });
      this.processQueue(); // Process next job
    });

    try {
      await runner.run();
    } catch (error) {
      this.running.delete(job.id);
      this.emit('jobError', { jobId: job.id, error });
    }
  }

  getStatus() {
    return {
      queue: this.queue.length,
      running: this.running.size,
      completed: this.completed.size,
      maxConcurrent: this.maxConcurrent
    };
  }

  getJobStatus(jobId: string) {
    if (this.running.has(jobId)) {
      return { status: 'running', jobId };
    }
    if (this.completed.has(jobId)) {
      return { status: 'completed', jobId, result: this.completed.get(jobId) };
    }
    return { status: 'queued', jobId };
  }

  stopJob(jobId: string) {
    const runner = this.running.get(jobId);
    if (runner) {
      runner.stop();
      this.running.delete(jobId);
      this.emit('jobStopped', { jobId });
    }
  }
}
