import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Mock webhook delivery queue stats
    // In production this would query Redis/BullMQ
    const mockQueue = {
      pending: 3,
      processing: 1,
      completed: 127,
      failed: 5,
      dlq: 2, // Dead Letter Queue
      retryPolicy: {
        maxAttempts: 3,
        backoffType: "exponential",
        baseDelay: 1000 // 1s
      },
      recentJobs: [
        {
          id: "webhook-job-1",
          type: "slack",
          event: "guardrails.breach",
          status: "completed",
          attempts: 1,
          timestamp: Date.now() - 300000
        },
        {
          id: "webhook-job-2",
          type: "email",
          event: "optimization.promote",
          status: "completed",
          attempts: 1,
          timestamp: Date.now() - 600000
        },
        {
          id: "webhook-job-3",
          type: "slack",
          event: "strategy.stop",
          status: "failed",
          attempts: 3,
          timestamp: Date.now() - 900000,
          error: "Connection timeout"
        }
      ],
      _mock: true
    };
    
    return NextResponse.json(mockQueue, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { _err: `queue-unavailable: ${e?.message ?? "connection-failed"}` }, 
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action, jobId } = body;
  
  if (action === "retry" && jobId) {
    // Mock retry from DLQ
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "webhook.retry",
        result: "ok",
        strategyId: "webhook-queue",
        timestamp: Date.now(),
        details: `Retrying webhook job: ${jobId} (mock)`
      })
    }).catch(() => {});
    
    return NextResponse.json({ ok: true, jobId, status: "retrying", _mock: true }, { status: 200 });
  }
  
  if (action === "purge_dlq") {
    // Mock purge DLQ
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "webhook.purge_dlq",
        result: "ok",
        strategyId: "webhook-queue",
        timestamp: Date.now(),
        details: "Purged DLQ (mock)"
      })
    }).catch(() => {});
    
    return NextResponse.json({ ok: true, purged: 2, _mock: true }, { status: 200 });
  }
  
  return NextResponse.json({ _err: "invalid action" }, { status: 400 });
}

