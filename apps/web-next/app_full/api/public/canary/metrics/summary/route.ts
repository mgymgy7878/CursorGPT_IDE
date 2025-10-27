import { NextRequest, NextResponse } from "next/server";

function parsePromText(text: string) {
  const lines = text.split(/\r?\n/);
  const out: Record<string, number> = {};
  for (const ln of lines) {
    if (!ln || ln.startsWith("#")) continue;
    const m = ln.match(/^(canary_(?:apply|idem|circuit)[^\s]*)\s+(\d+(?:\.\d+)?)/);
    if (m) {
      const key = m[1];
      const val = Number(m[2]);
      out[key] = (out[key] || 0) + val;
    }
  }
  return out;
}

export async function GET(_req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN?.trim() || "http://127.0.0.1:4001";
  const res = await fetch(`${origin}/metrics/prom`);
  const text = await res.text();
  const flat = parsePromText(text);
  // Basit özet: blocked reasons histogramını toparla
  const blocked: Record<string, number> = {};
  for (const [k, v] of Object.entries(flat)) {
    const m = k.match(/^canary_apply_blocked_total\{.*reason=\"([^\"]+)\".*\}/);
    if (m) blocked[m[1]] = (blocked[m[1]] || 0) + Number(v);
  }
  const summary = {
    totals: {
      apply_total: Object.entries(flat).filter(([k])=>k.startsWith("canary_apply_total")).reduce((a, [,v])=>a+v,0),
      idem_duplicate_total: flat["canary_idem_duplicate_total"] || 0,
      circuit_tripped_total: flat["canary_circuit_tripped_total"] || 0,
    },
    blocked,
  };
  return new NextResponse(JSON.stringify(summary), { status: 200, headers: { "content-type": "application/json" } });
} 