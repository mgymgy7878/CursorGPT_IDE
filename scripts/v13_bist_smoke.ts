import https from "https";
import fs from "fs";

const feed = process.env.BIST_FEED_URL || "";

if (!feed) {
  fs.writeFileSync(process.argv[2], JSON.stringify({ status_component: "SKIPPED", reason: "NO_FEED_URL" }, null, 2));
  process.exit(0);
}

https.get(feed, (r) => {
  let d = "";
  r.on("data", c => d += c);
  r.on("end", () => {
    const lines = d.split(/\r?\n/).filter(x => x).slice(0, 100);
    let seqGap = 0;
    let last: number | undefined;
    let lags: number[] = [];
    
    for (const ln of lines) {
      try {
        const j = JSON.parse(ln);
        if (typeof j.seq === "number") {
          if (last !== undefined && j.seq !== last + 1) seqGap++;
          last = j.seq;
        }
        if (typeof j.ts === "number") {
          lags.push(Date.now() - j.ts);
        }
      } catch {}
    }
    
    const s = [...lags].sort((a, b) => a - b);
    const p95 = s.length ? s[Math.min(s.length - 1, Math.floor(0.95 * s.length))] : null;
    
    fs.writeFileSync(process.argv[2], JSON.stringify({
      status_component: "OK",
      samples: lines.length,
      ingest_lag_ms_p95: p95,
      seq_gap_count: seqGap
    }, null, 2));
  });
}).on("error", (e) => {
  fs.writeFileSync(process.argv[2], JSON.stringify({
    status_component: "ERROR",
    reason: String(e)
  }, null, 2));
  process.exit(1);
}); 