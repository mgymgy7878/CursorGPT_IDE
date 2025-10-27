import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN?.trim() || "http://127.0.0.1:4001";
  const url = `${origin}/canary/confirm.plan`;
  const bodyText = await req.text();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-confirm-token": req.headers.get("x-confirm-token") ?? ""
    },
    body: bodyText || "{}"
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
} 