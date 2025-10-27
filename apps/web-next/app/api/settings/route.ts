import { NextRequest, NextResponse } from "next/server";
import { Settings, deepMerge } from "@/lib/settings";
import fs from "fs";
import path from "path";

const STORE = path.join(process.cwd(), ".data", "settings.json");

const readSettings = (): Settings => {
  try {
    return JSON.parse(fs.readFileSync(STORE, "utf-8"));
  } catch {
    return {};
  }
};
const writeSettings = (s: Settings) => {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(s, null, 2), "utf-8");
};

export async function GET() {
  return NextResponse.json(readSettings());
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Settings>;
  const cur = readSettings();
  const merged = deepMerge(cur, body);
  writeSettings(merged);
  return NextResponse.json({ ok: true, settings: merged });
}