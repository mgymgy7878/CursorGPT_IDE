import { EventEmitter } from 'events';
import { OptimizerJob } from "./optimizerQueue.js";
import { optimizerMetrics } from "./metrics.js";

export interface WorkerConfig {
  minWorkers: number;
  maxWorkers: number;
  burstCapacity: number;
  cpuLimit: number;
  memoryLimit: number;
}

export class OptimizerPool extends EventEmitter {
  private workers: Map<string, Worker> = new Map();
  private config: WorkerConfig;
  private isShuttingDown: boolean = false;

  constructor(config: WorkerConfig) {
    super();
    this.config = config;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker(): string {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const worker = new Worker(workerId, this.config);
    
    worker.on('completed', (job: OptimizerJob) => {
      this.handleJobCompleted(job);
    });

    worker.on('failed', (job: OptimizerJob, error: Error) => {
      this.handleJobFailed(job, error);
    });

    worker.on('idle', () => {
      this.emit('workerIdle', worker);
    });

    this.workers.set(workerId, worker);
    optimizerMetrics.optimizerWorkersRunning.set(this.workers.size);
    
    return workerId;
  }

  async executeJob(job: OptimizerJob): Promise<boolean> {
    if (this.isShuttingDown) {
      return false;
    }

    // Check if we need to scale up
    if (this.workers.size < this.config.maxWorkers) {
      const idleWorkers = Array.from(this.workers.values()).filter(w => w.isIdle());
      if (idleWorkers.length === 0) {
        this.createWorker();
      }
    }

    // Find available worker
    const availableWorker = Array.from(this.workers.values()).find(w => w.isIdle());
    if (!availableWorker) {
      return false;
    }

    // Execute job
    const startTime = Date.now();
    job.startedAt = startTime;
    job.status = 'started';

    optimizerMetrics.optimizerJobsTotal.inc({ 
      kind: job.kind, 
      source: job.source, 
      status: 'started' 
    });

    try {
      await availableWorker.execute(job);
      const duration = Date.now() - startTime;
      optimizerMetrics.optimizerJobRuntimeMs.observe({ kind: job.kind }, duration);
      
      job.completedAt = Date.now();
      job.status = 'succeeded';
      
      optimizerMetrics.optimizerJobsTotal.inc({ 
        kind: job.kind, 
        source: job.source, 
        status: 'succeeded' 
      });

      this.emit('jobCompleted', job);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      optimizerMetrics.optimizerJobRuntimeMs.observe({ kind: job.kind }, duration);
      
      job.status = 'failed';
      optimizerMetrics.optimizerJobsTotal.inc({ 
        kind: job.kind, 
        source: job.source, 
        status: 'failed' 
      });

      this.emit('jobFailed', job, error);
      return false;
    }
  }

  private handleJobCompleted(job: OptimizerJob): void {
    this.emit('jobCompleted', job);
  }

  private handleJobFailed(job: OptimizerJob, error: Error): void {
    this.emit('jobFailed', job, error);
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    // Wait for all workers to complete current jobs
    const promises = Array.from(this.workers.values()).map(worker => worker.shutdown());
    await Promise.all(promises);
    
    this.workers.clear();
    optimizerMetrics.optimizerWorkersRunning.set(0);
  }

  getStats(): { running: number; idle: number; total: number } {
    const running = Array.from(this.workers.values()).filter(w => !w.isIdle()).length;
    const idle = Array.from(this.workers.values()).filter(w => w.isIdle()).length;
    
    return {
      running,
      idle,
      total: this.workers.size
    };
  }
}

class Worker {
  private id: string;
  private config: WorkerConfig;
  private currentJob: OptimizerJob | null = null;
  private isIdleState: boolean = true;

  constructor(id: string, config: WorkerConfig) {
    this.id = id;
    this.config = config;
  }

  async execute(job: OptimizerJob): Promise<void> {
    this.currentJob = job;
    this.isIdleState = false;

    try {
      // Simulate job execution
      await this.processJob(job);
    } finally {
      this.currentJob = null;
      this.isIdleState = true;
    }
  }

  private async processJob(job: OptimizerJob): Promise<void> {
    // Job processing logic would go here
    // For now, simulate with timeout
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  isIdle(): boolean {
    return this.isIdleState;
  }

  async shutdown(): Promise<void> {
    if (this.currentJob) {
      // Wait for current job to complete or timeout
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
