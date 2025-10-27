import { PriorityQueue } from "./priorityQueue.js";
import { optimizerMetrics } from "./metrics.js";
export class OptimizerQueue {
    queue;
    agingThreshold = 30000; // 30s aging
    maxQueueDepth = 200;
    constructor() {
        this.queue = new PriorityQueue((a, b) => {
            // Priority: high > normal > low
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            // Aging: older jobs get higher priority
            const ageA = Date.now() - a.createdAt;
            const ageB = Date.now() - b.createdAt;
            if (ageA > this.agingThreshold && ageB <= this.agingThreshold)
                return -1;
            if (ageB > this.agingThreshold && ageA <= this.agingThreshold)
                return 1;
            // FIFO for same priority
            return a.createdAt - b.createdAt;
        });
    }
    enqueue(job) {
        if (this.queue.size() >= this.maxQueueDepth) {
            optimizerMetrics.optimizerPreemptionsTotal.inc({ reason: 'queue_full' });
            return false;
        }
        this.queue.enqueue(job);
        optimizerMetrics.optimizerJobsTotal.inc({
            kind: job.kind,
            source: job.source,
            status: 'enqueued'
        });
        optimizerMetrics.optimizerQueueDepth.set({ priority: job.priority }, this.queue.size());
        return true;
    }
    dequeue() {
        const job = this.queue.dequeue();
        if (job) {
            optimizerMetrics.optimizerQueueDepth.set({ priority: job.priority }, this.queue.size());
        }
        return job;
    }
    size() {
        return this.queue.size();
    }
    getQueueDepthByPriority() {
        const depths = { high: 0, normal: 0, low: 0 };
        // Implementation would count by priority
        return depths;
    }
    clear() {
        this.queue.clear();
        optimizerMetrics.optimizerQueueDepth.set({ priority: 'high' }, 0);
        optimizerMetrics.optimizerQueueDepth.set({ priority: 'normal' }, 0);
        optimizerMetrics.optimizerQueueDepth.set({ priority: 'low' }, 0);
    }
}
