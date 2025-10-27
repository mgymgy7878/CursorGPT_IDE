import { NextRequest } from "next/server";

const ORIGIN = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
const ALERTS_KEY = process.env.ALERTS_API_KEY || "";

async function forward(req: NextRequest, url: string, opts: RequestInit = {}) {
  const method = opts.method || req.method;
  const headers: Record<string, string> = {
    ...(req.headers.get("content-type") ? {"content-type": req.headers.get("content-type")!} : {}),
    ...(ALERTS_KEY ? {"x-alerts-key": ALERTS_KEY} : {}),
  };
  if (opts.headers) Object.assign(headers, opts.headers as any);
  let body: BodyInit | undefined = undefined;
  if (method !== "GET" && method !== "HEAD" && opts.body !== undefined) {
    body = opts.body as any;
  } else if (method !== "GET" && method !== "HEAD") {
    // pass-through body
    const txt = await req.text();
    body = txt;
  }
  const resp = await fetch(url, { method, headers, body, cache: "no-store" });
  const text = await resp.text();
  const type = resp.headers.get("content-type") || (text.trim().startsWith("{") ? "application/json" : "text/plain; charset=utf-8");
  return new Response(text, { status: resp.status, headers: { "content-type": type } });
}

export async function POST(req: NextRequest) {
  return forward(req, `${ORIGIN}/alerts/gc`);
}
