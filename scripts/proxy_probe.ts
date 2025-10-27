import http from "http";
import https from "https";
import { performance } from "perf_hooks";
import { URL } from "url";
import fs from "fs";

const ORIGIN = process.env.URL_ORIGIN || "https://api.btcturk.com/api/v2/ticker";
const TTL = parseInt(process.env.TTL_MS || "1000", 10);
const N = parseInt(process.env.N || "60", 10);
const CONC = parseInt(process.env.CONC || "10", 10);

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 64,
  maxFreeSockets: 16,
  timeout: 10_000
});

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 64,
  maxFreeSockets: 16,
  timeout: 10_000
});

function reqOnce(u: string): Promise<{ code: number; body: string; total_ms: number }> {
  const url = new URL(u);
  const isHttps = url.protocol === "https:";
  const mod = isHttps ? https : http;
  const agent = isHttps ? httpsAgent : httpAgent;

  return new Promise((res, rej) => {
    const t0 = performance.now();
    const r = mod.request({
      hostname: url.hostname,
      port: url.port || undefined,
      path: url.pathname + url.search,
      method: "GET",
      agent,
      headers: {
        "User-Agent": "spark-proxy/1.0",
        "Accept": "application/json",
        "Connection": "keep-alive"
      }
    }, (rr) => {
      let d = "";
      rr.on("data", c => d += c);
      rr.on("end", () => res({
        code: rr.statusCode || 0,
        body: d,
        total_ms: performance.now() - t0
      }));
    });
    r.on("error", rej);
    r.end();
  });
}

function pctl(xs: number[], q: number): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
}

async function runLoad(u: string, count: number, conc: number): Promise<number[]> {
  const out: number[] = [];
  let i = 0;

  async function worker() {
    for (;;) {
      const k = i++;
      if (k >= count) break;
      const r = await reqOnce(u);
      out.push(r.total_ms);
    }
  }

  const workers = Array(Math.max(1, conc)).fill(0).map(worker);
  await Promise.all(workers);
  return out;
}

type CacheItem = { body: string; expiry: number };
let cache: CacheItem | null = null;
let inflight: Promise<string> | null = null;

async function fetchUpstream(): Promise<string> {
  const r = await reqOnce(ORIGIN);
  if (r.code !== 200) throw new Error("HTTP " + r.code);
  return r.body;
}

async function getTicker(): Promise<string> {
  const now = Date.now();
  if (cache && cache.expiry > now) return cache.body;
  
  if (inflight) return inflight;
  
  inflight = fetchUpstream()
    .then(b => {
      cache = { body: b, expiry: Date.now() + TTL };
      inflight = null;
      return b;
    })
    .catch(e => {
      inflight = null;
      throw e;
    });
  
  return inflight;
}

async function startServer(): Promise<{ url: string; server: http.Server }> {
  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url && req.url.startsWith("/ticker")) {
      const t0 = performance.now();
      try {
        const body = await getTicker();
        res.setHeader("Content-Type", "application/json");
        res.end(body);
      } catch (e: any) {
        res.statusCode = 502;
        res.end(JSON.stringify({ error: String(e?.message || e) }));
      }
    } else if (req.method === "GET" && req.url === "/health") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ttl_ms: TTL }));
    } else {
      res.statusCode = 404;
      res.end("not found");
    }
  });

  await new Promise<void>(r => server.listen(0, "127.0.0.1", () => r()));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  
  return { url: `http://127.0.0.1:${port}/ticker`, server };
}

(async () => {
  const { url: proxyUrl, server } = await startServer();
  
  // Warmups
  await reqOnce(ORIGIN);
  await reqOnce(proxyUrl);
  
  const direct = await runLoad(ORIGIN, N, CONC);
  const proxied = await runLoad(proxyUrl, N, CONC);
  
  const direct_p95 = pctl(direct, 0.95);
  const prox_p95 = pctl(proxied, 0.95);
  const improve = (direct_p95 && prox_p95) ? Math.max(0, (1 - (prox_p95 / direct_p95)) * 100) : null;
  
  const out = {
    samples: N,
    conc: CONC,
    ttl_ms: TTL,
    direct: { p50: pctl(direct, 0.5), p95: direct_p95 },
    proxy: { p50: pctl(proxied, 0.5), p95: prox_p95 },
    improvement_pct: improve
  };
  
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
  server.close();
  
  console.log(JSON.stringify({
    summary: "OK",
    direct_p95_ms: direct_p95,
    proxy_p95_ms: prox_p95,
    improvement_pct: improve
  }));
})().catch(e => {
  console.error("ERR", e?.message || e);
  process.exit(1);
}); 