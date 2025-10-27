import http from "http";
import { URL } from "url";
import fs from "fs";

function pctl(xs: number[], q: number) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
}

async function run(root: string) {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url || "/", "http://x");
    if (u.pathname === "/stream") {
      const count = Number(u.searchParams.get("count") || "200");
      const spread = Number(u.searchParams.get("spread_ms") || "400");
      res.setHeader("Content-Type", "application/x-ndjson");
      const base = Date.now();
      for (let i = 1; i <= count; i++) {
        const ts = base - Math.floor(Math.random() * spread);
        const obj = { ts, seq: i, symbol: "BIST:MOCK", price: 100 + 0.01 * i, volume: 10 * i };
        res.write(JSON.stringify(obj) + "\n");
      }
      res.end();
    } else {
      res.statusCode = 404;
      res.end("not found");
    }
  });

  await new Promise<void>(r => server.listen(0, "127.0.0.1", () => r()));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const url = `http://127.0.0.1:${port}/stream?count=200&spread_ms=400`;

  // Fetch once and compute metrics
  const lags: number[] = [];
  let seqGap = 0;
  let last: number | undefined;

  await new Promise<void>((res, rej) => {
    http.get(url, (r) => {
      let buf = "";
      r.on("data", c => buf += c);
      r.on("end", () => {
        const now = Date.now();
        for (const ln of buf.split(/\r?\n/)) {
          if (!ln) continue;
          try {
            const j = JSON.parse(ln);
            if (typeof j.seq === "number") {
              if (last !== undefined && j.seq !== last + 1) seqGap++;
              last = j.seq;
            }
            if (typeof j.ts === "number") {
              lags.push(now - j.ts);
            }
          } catch {}
        }
        res();
      });
    }).on("error", rej);
  });

  const p95 = pctl(lags, 0.95) || 0;
  const metrics = {
    status_component: "OK",
    samples: lags.length,
    ingest_lag_ms: lags,
    ingest_lag_ms_p95: p95,
    seq_gap_count: seqGap,
    local_url: url
  };
  fs.writeFileSync(`${root}/metrics.json`, JSON.stringify(metrics, null, 2));

  const status = (p95 <= 2000 && seqGap === 0) ? "OK" : "ERROR";
  const index = {
    nonce: process.env.NONCE,
    started_utc: process.env.START,
    status_component: status,
    thresholds: { ingest_lag_p95_s_leq: 2, seq_gap_eq: 0 },
    ingest: { samples: lags.length, ingest_lag_ms_p95: p95, seq_gap_count: seqGap, local_url: url },
    evidence_paths: { index: `${root}/index.json`, metrics: `${root}/metrics.json`, manifest: `${root}/manifest.sha256` }
  };
  fs.writeFileSync(`${root}/index.json`, JSON.stringify(index, null, 2));
  server.close();
}

run(process.argv[2]).catch(e => {
  fs.writeFileSync(process.argv[3], String(e?.message || e));
  process.exit(1);
}); 