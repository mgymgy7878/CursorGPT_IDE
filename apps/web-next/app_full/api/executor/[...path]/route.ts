import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGET = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";

async function proxy(req: NextRequest, path: string[]) {
  const url = new URL(req.url);
  const qs = url.search || "";
  const dest = `${TARGET}/${(path || []).join("/")}${qs}`;

  // Header temizliği
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("x-proxy-target", "executor");

  const method = req.method.toUpperCase();
  const bodyAllowed = !["GET", "HEAD"].includes(method);
  const init: RequestInit = {
    method,
    headers,
    redirect: "manual",
    // @ts-ignore - Node fetch body
    body: bodyAllowed ? await req.arrayBuffer() : undefined,
  };

  const res = await fetch(dest, init);
  const outHeaders = new Headers(res.headers);
  outHeaders.set("x-proxy", "web-next");

  return new NextResponse(res.body, {
    status: res.status,
    headers: outHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) { return proxy(req, params.path); }
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) { return proxy(req, params.path); }
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) { return proxy(req, params.path); }
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) { return proxy(req, params.path); }
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) { return proxy(req, params.path); }
export async function HEAD(req: NextRequest, { params }: { params: { path: string[] } }) { return proxy(req, params.path); }
export async function OPTIONS(req: NextRequest, { params }: { params: { path: string[] } }) { return proxy(req, params.path); }
