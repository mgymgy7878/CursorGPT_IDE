/**
 * Job Store - In-memory job state management
 *
 * Dev/demo için in-memory singleton. İleride DB'ye taşınabilir.
 * Deterministic seed ile tekrarlanabilir sonuçlar (smoke/QA için).
 */

export type JobStatus = 'queued' | 'running' | 'success' | 'error';

export interface JobResult {
  trades: number;
  winRate: number; // 0-100
  maxDrawdown: number; // negative percentage
  sharpe: number;
  totalReturn: number; // percentage
}

export interface JobState {
  jobId: string;
  type: 'backtest' | 'optimize';
  status: JobStatus;
  progressPct: number; // 0-100
  startedAt: number;
  finishedAt?: number;
  result?: JobResult;
  error?: string;
}

class JobStore {
  private jobs: Map<string, JobState> = new Map();
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create a new job
   */
  createJob(type: 'backtest' | 'optimize'): string {
    const jobId = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const job: JobState = {
      jobId,
      type,
      status: 'queued',
      progressPct: 0,
      startedAt: Date.now(),
    };

    this.jobs.set(jobId, job);

    // Simulate job execution (deterministic seed)
    this.simulateJob(jobId);

    return jobId;
  }

  /**
   * Get job state
   */
  getJob(jobId: string): JobState | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Simulate job execution with deterministic results
   */
  private simulateJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Start running after 500ms
    setTimeout(() => {
      const currentJob = this.jobs.get(jobId);
      if (!currentJob) return;
      currentJob.status = 'running';
      this.jobs.set(jobId, currentJob);
    }, 500);

    // Simulate progress (3-6 seconds, deterministic based on jobId)
    const duration = 3000 + (jobId.charCodeAt(jobId.length - 1) % 3000); // 3-6s
    const steps = 20;
    const stepDuration = duration / steps;

    let step = 0;
    const interval = setInterval(() => {
      const currentJob = this.jobs.get(jobId);
      if (!currentJob) {
        clearInterval(interval);
        return;
      }

      step++;
      currentJob.progressPct = Math.min(100, (step / steps) * 100);
      this.jobs.set(jobId, currentJob);

      if (step >= steps) {
        clearInterval(interval);
        this.progressIntervals.delete(jobId);

        // Generate deterministic result
        const result = this.generateDeterministicResult(jobId, job.type);
        currentJob.status = 'success';
        currentJob.progressPct = 100;
        currentJob.finishedAt = Date.now();
        currentJob.result = result;
        this.jobs.set(jobId, currentJob);
      }
    }, stepDuration);

    this.progressIntervals.set(jobId, interval);
  }

  /**
   * Generate deterministic result based on jobId (seed)
   */
  private generateDeterministicResult(jobId: string, type: 'backtest' | 'optimize'): JobResult {
    // Simple hash function for deterministic seed
    let hash = 0;
    for (let i = 0; i < jobId.length; i++) {
      hash = ((hash << 5) - hash) + jobId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    // Deterministic random values based on hash
    const seed = Math.abs(hash);
    const trades = 50 + (seed % 100); // 50-150 trades
    const winRate = 45 + (seed % 15); // 45-60%
    const maxDrawdown = -5 - (seed % 10); // -5% to -15%
    const sharpe = 1.0 + (seed % 100) / 50; // 1.0-3.0
    const totalReturn = 5 + (seed % 20); // 5-25%

    return {
      trades,
      winRate,
      maxDrawdown,
      sharpe,
      totalReturn,
    };
  }

  /**
   * Cleanup old jobs (optional, prevent memory leak)
   */
  cleanup(maxAge: number = 3600000): void { // 1 hour default
    const now = Date.now();
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.finishedAt && (now - job.finishedAt) > maxAge) {
        this.jobs.delete(jobId);
        const interval = this.progressIntervals.get(jobId);
        if (interval) {
          clearInterval(interval);
          this.progressIntervals.delete(jobId);
        }
      }
    }
  }
}

// Singleton instance
export const jobStore = new JobStore();

