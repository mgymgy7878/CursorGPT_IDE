import { NextResponse } from "next/server";

const EXECUTOR_URL = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";

/**
 * SSE Proxy to executor /api/backtest/stream
 * Node runtime required (no Edge)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(`${EXECUTOR_URL}/api/backtest/stream`, {
      headers: {
        "Accept": "text/event-stream",
      },
      // @ts-ignore - Node fetch supports duplex
      duplex: "half",
    });

    if (!response.ok) {
      throw new Error(`Executor SSE failed: ${response.status}`);
    }

    // Forward SSE stream to client
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    // Fallback when executor unavailable
    return new NextResponse("SSE unavailable: " + err.message, {
      status: 503,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}

