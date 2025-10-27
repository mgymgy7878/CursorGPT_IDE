import { setTimeout as sleep } from "node:timers/promises";
import { writeFile } from "node:fs/promises";
import pLimit from "p-limit";

type Tf = "1m" | "5m" | "1h";
const BASE = process.env.BINANCE_BASE ?? "https://api.binance.com";
const limit = pLimit(2);

function tfMs(tf: Tf) {
  return tf === "1m" ? 60e3 : tf === "5m" ? 300e3 : 3_600e3;
}

async function getKlines(symbol: string, interval: Tf, start: number, end: number) {
  const url = new URL("/api/v3/klines", BASE);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("startTime", String(start));
  url.searchParams.set("endTime", String(end));
  url.searchParams.set("limit", "1000");
  const r = await fetch(url, { headers: { "x-binance-weight": "1" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as any[];
}

function normalize(exchange: string, symbol: string, tf: Tf, rows: any[]) {
  return rows.map(r => ({
    ts: Number(r[0]),
    exchange, symbol, tf,
    o: Number(r[1]), h: Number(r[2]), l: Number(r[3]), c: Number(r[4]),
    v: Number(r[5]), qv: Number(r[7]), n: Number(r[8]),
    vwap: Number(r[7]) / Math.max(Number(r[5]), 1e-12)
  }));
}

function detectGaps(items: { ts: number }[], step: number) {
  const gaps: number[] = [];
  for (let i = 1; i < items.length; i++) {
    const delta = items[i].ts - items[i - 1].ts;
    if (delta !== step) gaps.push(items[i].ts);
  }
  return gaps;
}

async function main() {
  const symbol = (process.env.SYMBOL ?? "BTCUSDT").toUpperCase();
  const tf = (process.env.TF ?? "1m") as Tf;
  const now = Date.now();
  const days = Number(process.env.DAYS ?? "180");
  const step = tfMs(tf);
  const start = now - days * 24 * 60 * 60 * 1000;

  // paginated fetch
  const spans: number[][] = [];
  for (let s = start; s < now; s += step * 1000) {
    spans.push([s, Math.min(now, s + step * 1000 - 1)]);
  }

  const out: any[] = [];
  for (const [i, span] of spans.entries()) {
    const fetchSpan = async () => {
      let cursor = span[0];
      while (cursor < span[1]) {
        const end = Math.min(span[1], cursor + step * 1000 * 1000);
        const rows = await getKlines(symbol, tf, cursor, end);
        out.push(...normalize("binance", symbol, tf, rows));
        cursor = end + 1;
        await sleep(25); // gentle
      }
    };
    await limit(fetchSpan);
    if (i % 100 === 0) await sleep(100);
  }
  out.sort((a, b) => a.ts - b.ts);
  const gaps = detectGaps(out, step);
  const meta = { symbol, tf, rows: out.length, gaps: gaps.length };
  
  // Gap-fail: If gaps detected, exit with error
  if (gaps.length > 0) {
    console.error(`GAP DETECTED: ${gaps.length} gaps found in ${symbol} ${tf} data`);
    console.error(`First gap at: ${new Date(gaps[0]).toISOString()}`);
    process.exit(2);
  }
  
  await writeFile(`./data/${symbol}_${tf}.json`, JSON.stringify({ meta, out }));
  console.log(JSON.stringify(meta));
}
main().catch(e => { console.error(e); process.exit(1); });