// Redis/BullMQ webhook queue adapter
// Production: import { Queue } from 'bullmq'
// import { Redis } from 'ioredis'

type QueueStats = {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  dlq: number;
  _err?: string;
};

type Job = {
  id: string;
  type: string;
  event: string;
  status: string;
  attempts: number;
  timestamp: number;
  error?: string;
};

export async function getQueueStats(): Promise<QueueStats & { recentJobs?: Job[] }> {
  // Production implementation:
  /*
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn("[Queue] REDIS_URL not configured");
    return { pending: 0, processing: 0, completed: 0, failed: 0, dlq: 0, _err: "redis_not_configured" };
  }
  
  try {
    const connection = new Redis(redisUrl);
    const alertQueue = new Queue('alerts:deliver', { connection });
    const dlqQueue = new Queue('alerts:dlq', { connection });
    
    const [waiting, active, completed, failed, dlqCount] = await Promise.all([
      alertQueue.getWaitingCount(),
      alertQueue.getActiveCount(),
      alertQueue.getCompletedCount(),
      alertQueue.getFailedCount(),
      dlqQueue.getWaitingCount()
    ]);
    
    const recentJobs = await alertQueue.getJobs(['completed', 'failed'], 0, 9);
    
    return {
      pending: waiting,
      processing: active,
      completed,
      failed,
      dlq: dlqCount,
      recentJobs: recentJobs.map(job => ({
        id: job.id!,
        type: job.data.type,
        event: job.data.event,
        status: await job.getState(),
        attempts: job.attemptsMade,
        timestamp: job.timestamp,
        error: job.failedReason
      }))
    };
  } catch (e: any) {
    console.error("[Queue] Redis stats failed:", e.message);
    return { pending: 0, processing: 0, completed: 0, failed: 0, dlq: 0, _err: e.message };
  }
  */
  
  // Mock implementation
  return {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    dlq: 0,
    _err: "redis_not_configured"
  };
}

export async function retryJob(jobId: string): Promise<{ ok: boolean; _err?: string }> {
  // Production implementation:
  /*
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return { ok: false, _err: "redis_not_configured" };
  
  try {
    const connection = new Redis(redisUrl);
    const dlqQueue = new Queue('alerts:dlq', { connection });
    const alertQueue = new Queue('alerts:deliver', { connection });
    
    const job = await dlqQueue.getJob(jobId);
    if (!job) return { ok: false, _err: "job_not_found" };
    
    await alertQueue.add('retry', job.data, { jobId: `retry-${jobId}` });
    await job.remove();
    
    return { ok: true };
  } catch (e: any) {
    return { ok: false, _err: e.message };
  }
  */
  
  return { ok: false, _err: "redis_not_configured" };
}

export async function purgeDLQ(): Promise<{ ok: boolean; purged: number; _err?: string }> {
  // Production implementation:
  /*
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return { ok: false, purged: 0, _err: "redis_not_configured" };
  
  try {
    const connection = new Redis(redisUrl);
    const dlqQueue = new Queue('alerts:dlq', { connection });
    
    const jobs = await dlqQueue.getJobs(['waiting', 'delayed']);
    await Promise.all(jobs.map(job => job.remove()));
    
    return { ok: true, purged: jobs.length };
  } catch (e: any) {
    return { ok: false, purged: 0, _err: e.message };
  }
  */
  
  return { ok: false, purged: 0, _err: "redis_not_configured" };
}

