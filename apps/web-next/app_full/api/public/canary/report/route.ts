import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const day = search.get("date") || new Date().toISOString().slice(0,10);
  const root = path.resolve(process.cwd(), "evidence", "canary", "reports", day);
  const summary = path.join(root, "SUMMARY.json");
  if (!fs.existsSync(summary)) {
    try { execSync(`node scripts/canary-report.mjs ${day}`, { stdio: "ignore" }); } catch {}
  }
  if (!fs.existsSync(summary)) {
    return new NextResponse(JSON.stringify({ day, total: 0, decisions: {}, nonces: [] }), { status: 200, headers: { "content-type":"application/json" } });
  }
  const buf = fs.readFileSync(summary);
  return new NextResponse(buf, { status: 200, headers: { "content-type":"application/json" } });
} 