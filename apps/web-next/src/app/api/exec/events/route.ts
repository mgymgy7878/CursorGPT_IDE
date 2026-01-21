import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const EXECUTOR_URL = process.env.EXECUTOR_URL || process.env.NEXT_PUBLIC_EXECUTOR_URL || "http://localhost:4001";

export async function GET(req: NextRequest) {
  const upstream = new URL("/api/exec/events", EXECUTOR_URL);
  upstream.search = req.nextUrl.search;

  try {
    const upstreamRes = await fetch(upstream, {
      headers: {
        Accept: "text/event-stream",
      },
      cache: "no-store",
    });

    if (!upstreamRes.ok) {
      return new Response(`Upstream error: ${upstreamRes.status} ${upstreamRes.statusText}`, {
        status: upstreamRes.status,
      });
    }

    if (!upstreamRes.body) {
      return new Response("Upstream has no body", { status: 502 });
    }

    // SSE headers (critical for streaming)
    const headers = new Headers(upstreamRes.headers);
    headers.set("Content-Type", "text/event-stream; charset=utf-8");
    headers.set("Cache-Control", "no-cache, no-transform");
    headers.set("Connection", "keep-alive");
    headers.set("X-Accel-Buffering", "no");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET");

    // Stream the body directly (no buffering)
    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers,
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: "executor_unreachable", detail: String(e?.message || e) }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
