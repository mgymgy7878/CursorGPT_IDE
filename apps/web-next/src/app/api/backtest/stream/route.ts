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
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${EXECUTOR_URL}/api/backtest/stream`, {
      headers: {
        "Accept": "text/event-stream",
      },
      signal: controller.signal,
      // @ts-ignore - Node fetch supports duplex
      duplex: "half",
    });

    clearTimeout(timeout);

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
    console.error('Backtest stream error:', err.message);
    
    // Return mock SSE stream instead of 503
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(`data: {"type":"error","message":"Backend not available, using mock data"}\n\n`);
        controller.enqueue(`data: {"type":"progress","percent":100}\n\n`);
        controller.enqueue(`data: {"type":"complete","result":"mock"}\n\n`);
        controller.close();
      }
    });

    return new NextResponse(mockStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }
}

