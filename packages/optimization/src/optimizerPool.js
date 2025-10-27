import { EventEmitter } from 'events';
import { optimizerMetrics } from "./metrics.js";
export class OptimizerPool extends EventEmitter {
    workers = new Map();
    config;
    isShuttingDown = false;
    constructor(config) {
        super();
        this.config = config;
        this.initializeWorkers();
    }
    initializeWorkers() {
        for (let i = 0; i < this.config.minWorkers; i++) {
            this.createWorker();
        }
    }
    createWorker() {
        const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const worker = new Worker(workerId, this.config);
        worker.on('completed', (job) => {
            this.handleJobCompleted(job);
        });
        worker.on('failed', (job, error) => {
            this.handleJobFailed(job, error);
        });
        worker.on('idle', () => {
            this.emit('workerIdle', worker);
        });
        this.workers.set(workerId, worker);
        optimizerMetrics.optimizerWorkersRunning.set(this.workers.size);
        return workerId;
    }
    async executeJob(job) {
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
        }
        catch (error) {
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
    handleJobCompleted(job) {
        this.emit('jobCompleted', job);
    }
    handleJobFailed(job, error) {
        this.emit('jobFailed', job, error);
    }
    async shutdown() {
        this.isShuttingDown = true;
        // Wait for all workers to complete current jobs
        const promises = Array.from(this.workers.values()).map(worker => worker.shutdown());
        await Promise.all(promises);
        this.workers.clear();
        optimizerMetrics.optimizerWorkersRunning.set(0);
    }
    getStats() {
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
    id;
    config;
    currentJob = null;
    isIdleState = true;
    constructor(id, config) {
        this.id = id;
        this.config = config;
    }
    async execute(job) {
        this.currentJob = job;
        this.isIdleState = false;
        try {
            // Simulate job execution
            await this.processJob(job);
        }
        finally {
            this.currentJob = null;
            this.isIdleState = true;
        }
    }
    async processJob(job) {
        // Job processing logic would go here
        // For now, simulate with timeout
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }
    isIdle() {
        return this.isIdleState;
    }
    async shutdown() {
        if (this.currentJob) {
            // Wait for current job to complete or timeout
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
