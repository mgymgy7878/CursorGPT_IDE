import https from "https";
import { performance } from "perf_hooks";
import fs from "fs";

const base = process.env.BASE || "https://testnet.binance.vision";
const N = parseInt(process.env.N || "10", 10);

function pctl(xs: number[], q: number) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
}

function doReq(path: string) {
  return new Promise<number>((res, rej) => {
    const t0 = performance.now();
    https.get(new URL(base + path), (r) => {
      r.on("data", () => {});
      r.on("end", () => res(performance.now() - t0));
    }).on("error", rej);
  });
}

async function run() {
  const ping: number[] = [];
  const time: number[] = [];
  let skew: number | null = null;

  for (let i = 0; i < N; i++) {
    ping.push(await doReq("/api/v3/ping"));
    const t0 = Date.now();
    const lat = await new Promise<number>((res, rej) => {
      const t = performance.now();
      https.get(new URL(base + "/api/v3/time"), (r) => {
        let d = "";
        r.on("data", c => d += c);
        r.on("end", () => {
          try {
            const j = JSON.parse(d);
            const now = Date.now();
            skew = (typeof j.serverTime === "number") ? (now - j.serverTime) : null;
            res(performance.now() - t);
          } catch (e) {
            res(performance.now() - t);
          }
        });
      }).on("error", rej);
    });
    time.push(lat);
  }

  const out = {
    keys_present: (process.env.API_KEY ? 1 : 0) && (process.env.API_SECRET ? 1 : 0) ? 1 : 0,
    ping_ms: ping,
    ping_p95_ms: pctl(ping, 0.95),
    time_ms: time,
    time_p95_ms: pctl(time, 0.95),
    clock_skew_ms: skew
  };

  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
}

run().catch(e => {
  fs.writeFileSync(process.argv[2], JSON.stringify({ error: String(e?.message || e) }));
  process.exit(1);
}); 