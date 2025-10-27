import http from "http";
import fs from "fs";

type Rec = { ts: number; seq: number; symbol: string; price: number; volume: number };

const pctl = (xs: number[], q: number) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
};

async function main(root: string) {
  // 1) Local NDJSON server
  const server = http.createServer((req, res) => {
    const u = new URL(req.url || "/", "http://x");
    if (u.pathname === "/stream") {
      const count = Number(u.searchParams.get("count") || "200");
      const spread = Number(u.searchParams.get("spread_ms") || "400");
      res.setHeader("Content-Type", "application/x-ndjson");
      const base = Date.now();
      for (let i = 1; i <= count; i++) {
        const ts = base - Math.floor(Math.random() * spread);
        const obj: Rec = { ts, seq: i, symbol: "BIST:MOCK", price: 100 + 0.01 * i, volume: 10 * i };
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
  const port = (typeof addr === "object" && addr) ? addr.port : 0;
  const url = `http://127.0.0.1:${port}/stream?count=200&spread_ms=400`;

  // 2) Consumer + persist (append-only JSONL)
  const sinkPath = `${root}/sink.jsonl`;
  const sink = fs.createWriteStream(sinkPath, { flags: "a" });
  const lags: number[] = [];
  const dbLat: number[] = [];
  let seqGap = 0;
  let lastSeq: number | undefined;

  await new Promise<void>((res, rej) => {
    http.get(url, (r) => {
      let buf = "";
      r.on("data", (c) => {
        buf += c;
        let idx;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (!line) continue;
          try {
            const j = JSON.parse(line) as Rec;
            const now = Date.now();
            // ingest lag (now - ts)
            if (typeof j.ts === "number") {
              lags.push(now - j.ts);
            }
            // seq gap
            if (typeof j.seq === "number") {
              if (lastSeq !== undefined && j.seq !== lastSeq + 1) seqGap++;
              lastSeq = j.seq;
            }
            // persist latency: write callback round-trip
            const t0 = Date.now();
            if (!sink.write(line + "\n", () => {
              dbLat.push(Date.now() - t0);
            })) {
              sink.once("drain", () => {}); // backpressure accounted by callback timing
            }
          } catch { /* ignore parse errors */ }
        }
      });
      r.on("end", () => res());
    }).on("error", rej);
  });
  sink.end();

  // 3) Summaries
  const ingest_p95 = pctl(lags, 0.95) || 0;
  const db_p95 = pctl(dbLat, 0.95) || 0;
  const metrics = {
    ingest_lag_ms: lags,
    ingest_lag_ms_p95: ingest_p95,
    event_db_latency_ms: dbLat,
    event_db_latency_ms_p95: db_p95,
    seq_gap_count: seqGap,
    samples: lags.length,
    local_url: url,
    sink_path: sinkPath
  };
  fs.writeFileSync(`${root}/metrics.json`, JSON.stringify(metrics, null, 2));

  const status = (ingest_p95 <= 2000 && db_p95 <= 300 && seqGap === 0) ? "OK" : (db_p95 > 300 ? "WARNING" : "ERROR");
  const index = {
    nonce: process.env.NONCE,
    started_utc: process.env.START,
    status_component: status,
    thresholds: { ingest_lag_p95_s_leq: 2, event_db_p95_ms_leq: 300, seq_gap_eq: 0 },
    ingest: {
      samples: metrics.samples,
      ingest_lag_ms_p95: metrics.ingest_lag_ms_p95,
      seq_gap_count: metrics.seq_gap_count,
      local_url: metrics.local_url
    },
    persist: {
      event_db_latency_ms_p95: metrics.event_db_latency_ms_p95,
      sink_path: metrics.sink_path
    },
    evidence_paths: {
      index: `${root}/index.json`,
      metrics: `${root}/metrics.json`,
      manifest: `${root}/manifest.sha256`
    }
  };
  fs.writeFileSync(`${root}/index.json`, JSON.stringify(index, null, 2));
  server.close();
}

main(process.argv[2]).catch(e => {
  fs.writeFileSync(`${process.argv[2]}/run.err`, String(e?.message || e));
  process.exit(1);
}); 