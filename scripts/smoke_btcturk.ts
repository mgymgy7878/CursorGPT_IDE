import https from "https";
import { performance } from "perf_hooks";
import fs from "fs";

const url = process.env.BTCTURK_TICKER_URL || "https://api.btcturk.com/api/v2/ticker";
const n = parseInt(process.env.N || "5", 10);
const lat: number[] = [];
let httpStatus: number = 0;
let schemaOK = 0;

function get(u: string): Promise<any> {
  return new Promise((res, rej) => {
    const t0 = performance.now();
    https.get(u, (r) => {
      httpStatus = r.statusCode || 0;
      let d = "";
      r.on("data", (c) => d += c);
      r.on("end", () => {
        lat.push(performance.now() - t0);
        try {
          res(JSON.parse(d));
        } catch (e) {
          res({ raw: d });
        }
      });
    }).on("error", rej);
  });
}

(async () => {
  for (let i = 0; i < n; i++) {
    const j = await get(url);
    if (j?.data && Array.isArray(j.data) && j.data.length > 0) {
      const x = j.data[0];
      if (("pair" in x) && ("last" in x) && ("timestamp" in x)) {
        schemaOK = 1;
      }
    }
  }
  
  const xs = [...lat].sort((a, b) => a - b);
  const p95 = xs.length ? xs[Math.min(xs.length - 1, Math.floor(0.95 * xs.length))] : null;
  
  fs.writeFileSync(process.argv[2], JSON.stringify({
    n,
    http_status: httpStatus,
    api_latency_ms: lat,
    api_latency_p95_ms: p95,
    schema_ok: schemaOK
  }, null, 2));
})().catch(e => {
  fs.writeFileSync(process.argv[2], JSON.stringify({ error: String(e) }, null, 2));
  process.exit(1);
}); 