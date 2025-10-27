import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST() {
  const r = await fetch("http://127.0.0.1:3003/api/gates/summary", { cache: "no-store" });
  const j = await r.json();
  if (!j?.allPass) {
    return NextResponse.json({ ok: false, error: "Gates not satisfied (6/6 PASS değil)." }, { status: 400 });
  }
  const rec = {
    type: "promote_request",
    at: new Date().toISOString(),
    gates: j.rows,
  };
  const root = path.join(process.cwd(), "..", "..");
  const dir = path.join(root, "evidence/ml");
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(path.join(dir, "promote_requests.jsonl"), JSON.stringify(rec) + "\n", "utf8");
  return NextResponse.json({ ok: true, message: "Promote isteği kaydedildi." });
}

