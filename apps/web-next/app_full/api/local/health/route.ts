import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const origin = process.env.EXECUTOR_ORIGIN;
  if (!origin) {
    return NextResponse.json(
      { error: "missing_EXECUTOR_ORIGIN", hint: "Create apps/web-next/.env.local and restart dev server." },
      { status: 500 }
    );
  }
  try {
    const r = await fetch(`${origin}/api/public/live/health`, { cache: "no-store" });
    const body = await r.json().catch(() => ({}));
    return NextResponse.json(body, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { error: "proxy_failed", reason: e?.message || "fetch_error", target: `${origin}/api/public/live/health` },
      { status: 502 }
    );
  }
} 