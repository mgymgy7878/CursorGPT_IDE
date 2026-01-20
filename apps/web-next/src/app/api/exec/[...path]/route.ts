import { NextRequest } from "next/server";

const BASE =
  process.env.EXECUTOR_URL ||
  process.env.NEXT_PUBLIC_EXECUTOR_URL ||
  "http://127.0.0.1:4001";

async function proxy(req: NextRequest, pathParts: string[]) {
  const path = pathParts.join("/");
  const url = new URL(req.url);
  const upstream = new URL(`/api/exec/${path}`, BASE);
  upstream.search = url.search;

  const init: RequestInit = {
    method: req.method,
    cache: "no-store",
    headers: {
      // Accept forward (SSE için önemli)
      accept: req.headers.get("accept") || "*/*",
      "content-type": req.headers.get("content-type") || "",
    },
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const bodyText = await req.text();
    init.body = bodyText;
  }

  try {
    const res = await fetch(upstream, init);

    // headers passthrough + SSE stabilize
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "no-cache, no-transform");
    headers.set("X-Accel-Buffering", "no");

    return new Response(res.body, {
      status: res.status,
      headers,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: "executor_unreachable", detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(ctx.params);
  return proxy(req, params.path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(ctx.params);
  return proxy(req, params.path);
}
