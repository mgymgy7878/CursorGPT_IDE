import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

function safeRead(p: string) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}
export async function GET(req: NextRequest) {
  const nonce = req.nextUrl.searchParams.get("nonce") || "";
  if (!nonce) return new NextResponse(JSON.stringify({ error: "missing nonce" }), { status: 400, headers: { "content-type": "application/json" } });

  const base = path.resolve(process.cwd(), "evidence", "canary", nonce);
  const out = {
    nonce,
    plan: safeRead(path.join(base, "plan.json")),
    latency: safeRead(path.join(base, "latency.json")),
    confirm: safeRead(path.join(base, "confirm.json")),
    live_plan: safeRead(path.join(base, "live_plan.json")),
    live_apply: safeRead(path.join(base, "live_apply.json")),
  };
  return new NextResponse(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json" } });
} 