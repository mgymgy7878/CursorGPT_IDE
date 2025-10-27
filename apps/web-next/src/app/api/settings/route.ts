import { NextResponse } from "next/server";
import type { Settings } from "@/types/settings";
import fs from "node:fs/promises";
const STORE = "/tmp/spark_settings.json";

let mem: Settings | null = null;

async function readStore(): Promise<Settings | null> {
  try { const s = await fs.readFile(STORE, "utf8"); return JSON.parse(s); } catch { return null; }
}
async function writeStore(data: Settings) {
  await fs.writeFile(STORE, JSON.stringify(data, null, 2), "utf8");
}

const DEFAULTS: Settings = {
  theme: "light",
  language: "tr",
  exchanges: {},
  ai: {},
};

export async function GET() {
  if (!mem) mem = (await readStore()) ?? DEFAULTS;
  return NextResponse.json({ ...mem, updatedAt: new Date().toISOString() });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Settings>;
  if (!mem) mem = (await readStore()) ?? DEFAULTS;

  mem = {
    theme: body.theme ?? mem.theme ?? "light",
    language: body.language ?? mem.language ?? "tr",
    exchanges: { ...mem.exchanges, ...(body.exchanges ?? {}) },
    ai: { ...(mem.ai ?? {}), ...(body.ai ?? {}) },
    updatedAt: new Date().toISOString(),
  };
  try { await writeStore(mem); } catch { /* ephemeral ortamda sorun olmaz */ }

  return NextResponse.json(mem);
}
