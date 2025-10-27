import https from "https";
import { performance } from "perf_hooks";
import fs from "fs";
import { URL } from "url";

type Sample = {
  dns_ms?: number;
  tcp_ms?: number;
  tls_ms?: number;
  ttfb_ms: number;
  total_ms: number;
  code: number;
};

type Stats = {
  p50: number | null;
  p95: number | null;
};

type ScenarioOut = {
  name: string;
  samples: Sample[];
  p50: Stats;
  p95: Stats;
};

const urlStr = process.env.URL || "https://api.btcturk.com/api/v2/ticker";
const N = parseInt(process.env.N || "20", 10);
const CONC = parseInt(process.env.CONC || "5", 10);

function pctl(xs: number[], q: number): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
}

function summarize(ss: Sample[]): { p50: Stats; p95: Stats } {
  const ttfb = ss.map(s => s.ttfb_ms);
  const tot = ss.map(s => s.total_ms);
  return {
    p50: { p50: pctl(ttfb, 0.5), p95: pctl(tot, 0.5) },
    p95: { p50: pctl(ttfb, 0.95), p95: pctl(tot, 0.95) }
  } as any;
}

function once<T extends any[]>(em: any, ev: string, fn: (...a: T) => void) {
  em.once(ev, (...a: T) => fn(...a));
}

function doReq(u: URL, agent: https.Agent): Promise<Sample> {
  const t0 = performance.now();
  let tLookup: number | undefined;
  let tConnect: number | undefined;
  let tTLS: number | undefined;
  let tResp: number | undefined;

  return new Promise((res, rej) => {
    const opt: https.RequestOptions = {
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        "User-Agent": "spark-latency-probe/1.0",
        "Accept": "application/json",
        "Connection": "keep-alive"
      },
      agent
    };

    const req = https.request(opt, (r) => {
      const ttfb = performance.now() - t0;
      let d = "";
      r.on("data", c => d += c);
      r.on("end", () => res({
        dns_ms: tLookup,
        tcp_ms: tConnect,
        tls_ms: tTLS,
        ttfb_ms: ttfb,
        total_ms: performance.now() - t0,
        code: r.statusCode || 0
      }));
    });

    req.on("socket", (s: any) => {
      once(s, "lookup", () => { tLookup = performance.now() - t0; });
      once(s, "connect", () => { tConnect = performance.now() - t0 - (tLookup || 0); });
      once(s, "secureConnect", () => { tTLS = performance.now() - t0 - (tLookup || 0) - (tConnect || 0); });
    });

    req.on("error", rej);
    req.end();
  });
}

async function runScenario(name: string, n: number, agent: https.Agent, conc: number): Promise<ScenarioOut> {
  const u = new URL(urlStr);
  const out: Sample[] = [];

  const worker = async () => {
    const s = await doReq(u, agent);
    out.push(s);
  };

  if (conc <= 1) {
    for (let i = 0; i < n; i++) await worker();
  } else {
    let i = 0;
    const pool = new Array(conc).fill(0).map(async function loop() {
      while (i < n) {
        const me = i++;
        await worker();
      }
    });
    await Promise.all(pool);
  }

  return { name, samples: out, p50: summarize(out).p50, p95: summarize(out).p95 };
}

(async () => {
  const coldAgent = new https.Agent({ keepAlive: false });
  const kaAgent1 = new https.Agent({ keepAlive: true, maxSockets: 1 });
  const kaAgentC = new https.Agent({ keepAlive: true, maxSockets: Math.max(2, CONC) });

  const cold = await runScenario("COLD_SEQ", N, coldAgent, 1);
  const ka_seq = await runScenario("KA_SEQ", N, kaAgent1, 1);
  const ka_conc = await runScenario("KA_CONC", N, kaAgentC, CONC);

  const out = {
    url: urlStr,
    n: N,
    conc: CONC,
    scenarios: {
      cold_seq: cold,
      ka_seq,
      ka_conc
    }
  };

  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2));

  const toP95 = (s: ScenarioOut) => ({ ttfb_ms: s.p95.p50, total_ms: s.p95.p95 });
  const c = toP95(cold);
  const a = toP95(ka_seq);
  const b = toP95(ka_conc);

  const summary = {
    cold_p95_total_ms: c.total_ms,
    ka_seq_p95_total_ms: a.total_ms,
    ka_conc_p95_total_ms: b.total_ms
  };

  console.log(JSON.stringify({ summary, url: urlStr }));
})().catch(e => {
  console.error("ERR", e?.message || e);
  process.exit(1);
}); 