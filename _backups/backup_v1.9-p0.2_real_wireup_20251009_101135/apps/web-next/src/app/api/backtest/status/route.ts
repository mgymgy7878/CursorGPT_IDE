import { NextResponse } from "next/server";

const EXECUTOR_URL = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";
const TIMEOUT_MS = 2000;

/**
 * Proxy to executor /api/backtest/status
 * Provides server-side endpoint for client-side consumption
 */
export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${EXECUTOR_URL}/api/backtest/status`, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Executor returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    // Graceful fallback for executor down
    if (err.name === "AbortError") {
      return NextResponse.json(
        { 
          error: "Executor timeout", 
          runs: [], 
          stats: { total: 0, running: 0, queued: 0, done: 0, failed: 0 } 
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: "Executor unreachable", 
        message: err.message,
        runs: [], 
        stats: { total: 0, running: 0, queued: 0, done: 0, failed: 0 } 
      },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

