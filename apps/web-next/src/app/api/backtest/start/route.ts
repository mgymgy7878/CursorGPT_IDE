import { NextResponse } from "next/server";

const EXECUTOR_URL = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";
const TIMEOUT_MS = 60000;

/**
 * POST /api/backtest/start
 * Proxy to executor with ADMIN_TOKEN forwarding
 */
export async function POST(req: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body = await req.json();
    
    // Forward admin token from request headers or cookie
    const adminToken =
      req.headers.get("x-admin-token") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";

    const res = await fetch(`${EXECUTOR_URL}/api/backtest/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json();

    // Map executor status codes
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Admin token required" },
        { status: 401 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Executor error", ...data },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Executor unreachable", message: err.message },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

