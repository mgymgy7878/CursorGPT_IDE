import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN;
  const token = process.env.EXECUTOR_TOKEN || "";
  if (!origin) {
    return NextResponse.json({ error: "missing_EXECUTOR_ORIGIN" }, { status: 500 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const r = await fetch(`${origin}/api/public/strategy/deploy-live`, {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { error: "proxy_failed", reason: e?.message || "fetch_error", target: `${origin}/api/public/strategy/deploy-live` },
      { status: 502 }
    );
  }
} 