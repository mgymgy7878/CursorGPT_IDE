// =============================
// FILE: apps/web-next/app/api/agent/route.ts
// Minimal agent endpoint. Supports tool-commands like /backtest and /optimize via executor.
// Uses AI config from settings.
// =============================
import { NextRequest, NextResponse } from "next/server";
import { Settings } from "@/lib/settings";
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

const EXECUTOR_BASE = process.env.EXECUTOR_BASE || "http://127.0.0.1:4001";

export async function POST(req: NextRequest) {
  const { messages, code } = await req.json();
  const settings = readSettings();

  // Simple tool routing by prefix
  const last = messages?.[messages.length - 1]?.content as string | undefined;
  if (last?.startsWith("/backtest")) {
    try {
      const r = await fetch(`${EXECUTOR_BASE}/api/backtest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await r.json();
      return NextResponse.json({ role: "tool", tool: "backtest", data });
    } catch (e: any) {
      return NextResponse.json({ role: "tool", tool: "backtest", error: String(e) }, { status: 500 });
    }
  }
  if (last?.startsWith("/optimize")) {
    try {
      const r = await fetch(`${EXECUTOR_BASE}/api/optimize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await r.json();
      return NextResponse.json({ role: "tool", tool: "optimize", data });
    } catch (e: any) {
      return NextResponse.json({ role: "tool", tool: "optimize", error: String(e) }, { status: 500 });
    }
  }

  // Fallback: forward to OpenAI-compatible endpoint
  const { ai } = settings;
  if (!ai) {
    return NextResponse.json({ error: "AI settings not configured" }, { status: 400 });
  }
  const url = `${ai.baseUrl?.replace(/\/$/, "")}/chat/completions`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${ai.apiKey ?? process.env.OPENAI_API_KEY ?? ""}`
      },
      body: JSON.stringify({
        model: ai.model || "gpt-4o-mini",
        messages: messages ?? []
      })
    });
    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
