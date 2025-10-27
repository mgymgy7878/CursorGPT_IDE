import { NextResponse } from "next/server";
const B = process.env.EXECUTOR_BASE_URL;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (B) {
    try {
      const r = await fetch(`${B}/api/exchange/btcturk/test`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const json = await r.json();
      return NextResponse.json(json, { status: r.status });
    } catch {}
  }
  const ok = typeof body?.apiKey === "string" && body.apiKey.length >= 10 &&
             typeof body?.secret === "string" && body.secret.length >= 10;
  return NextResponse.json({ ok, mode: "mock" }, { status: ok ? 200 : 400 });
}
