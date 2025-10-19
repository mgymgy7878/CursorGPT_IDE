import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxy to executor
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const sub = params.path.join("/");
  const url = `${EXEC}/alerts/${sub}?${new URL(req.url).searchParams}`;
  
  const r = await fetch(url);
  const body = await r.text();
  
  return new NextResponse(body, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" }
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const sub = params.path.join("/");
  const url = `${EXEC}/alerts/${sub}`;
  
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await req.text()
  });
  
  const body = await r.text();
  
  return new NextResponse(body, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" }
  });
}

