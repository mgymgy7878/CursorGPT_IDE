import { NextResponse } from "next/server";
import { BacktestRun } from "@/types/backtest";
import path from "node:path";
import fs from "node:fs/promises";

const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "backtest");

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  // 1) Evidence json araması
  try {
    const files = await fs.readdir(EVIDENCE_DIR);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const raw = await fs.readFile(path.join(EVIDENCE_DIR, f), "utf8");
      const data = JSON.parse(raw);
      const candidates: BacktestRun[] = Array.isArray(data?.runs) ? data.runs : [data];
      const found = candidates.find(r => String(r.id) === id);
      if (found) return NextResponse.json(found);
    }
  } catch {}
  // 2) Yoksa 404
  return new NextResponse("Not Found", { status: 404 });
}

