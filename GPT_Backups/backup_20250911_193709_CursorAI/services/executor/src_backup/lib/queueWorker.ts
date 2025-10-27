import { DurableQueue } from "./durableQueue";

const visibility = Number(process.env.QUEUE_VISIBILITY_MS || 10000);

export async function startQueueWorker(handle: (p: any) => Promise<void>) {
  const q = new DurableQueue(
    process.env.QUEUE_DIR || "runtime/queue", 
    process.env.QUEUE_NAME || "signals"
  );
  
  await q.init();
  
  // Expired jobs'ları temizle
  setInterval(() => q.reapExpired(), 1000);
  
  // Ana worker döngüsü
  for (;;) {
    const job = await q.claimNext(visibility);
    
    if (!job) {
      await new Promise(r => setTimeout(r, 200));
      continue;
    }
    
    try {
      await handle(job.payload);
      await q.ack(job.id);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      // Visibility bitince yeniden teslim edilecek
    }
  }
} 