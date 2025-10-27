import https from "https";
import fs from "fs";

const feed = process.env.BIST_FEED_URL || "";

if (!feed) {
  fs.writeFileSync(process.argv[2], JSON.stringify({
    status_component: "SKIPPED",
    reason: "NO_FEED_URL"
  }));
  process.exit(0);
}

https.get(feed, (r) => {
  let d = "";
  r.on("data", (c) => d += c);
  r.on("end", () => {
    // Basit örnek: ilk 50 satır varsayımı; "ts" (epoch ms) ve "seq" alanlarını arar
    const lines = d.split(/\r?\n/).filter(x => x).slice(0, 50);
    let seqGap = 0;
    let lastSeq: number | undefined;
    let lags: number[] = [];
    
    for (const ln of lines) {
      try {
        const j = JSON.parse(ln);
        if (typeof j.seq === "number") {
          if (lastSeq !== undefined && j.seq !== lastSeq + 1) {
            seqGap++;
          }
          lastSeq = j.seq;
        }
        if (typeof j.ts === "number") {
          const now = Date.now();
          lags.push(now - j.ts);
        }
      } catch {}
    }
    
    const xs = [...lags].sort((a, b) => a - b);
    const p95 = xs.length ? xs[Math.min(xs.length - 1, Math.floor(0.95 * xs.length))] : null;
    
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
  }));
  process.exit(1);
}); 