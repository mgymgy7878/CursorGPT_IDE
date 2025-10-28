import { NextResponse } from "next/server";

const EXECUTOR_URL = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";
const TIMEOUT_MS = 30000;

/**
 * DELETE /api/backtest/cancel/:id
 * Proxy to executor with ADMIN_TOKEN forwarding
 */
export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Forward admin token from request headers
    const adminToken =
      _.headers.get("x-admin-token") ||
      _.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";

    const res = await fetch(`${EXECUTOR_URL}/api/backtest/cancel/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-token": adminToken,
      },
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

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Run not found", id },
        { status: 404 }
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

