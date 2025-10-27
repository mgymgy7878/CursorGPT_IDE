import https from "https";
import crypto from "crypto";
import { performance } from "perf_hooks";
import fs from "fs";

const base = process.env.BASE || "https://api.btcturk.com";
const pth = process.env.PATH_PRIV || "/api/v1/users/balances";
const apiKey = process.env.API_KEY || "";
const apiSecret = process.env.API_SECRET || "";
const N = parseInt(process.env.N || "2", 10);

type Mode = "A" | "B" | "C";
type Rec = { mode: Mode; try: number; code: number; ms: number; body: string };

const out: Record<string, Rec[]> = { A: [], B: [], C: [] };
let retries = 0;
let circuitOpen = 0;

function hmacHex(secret: string, msg: string): string {
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function headersFor(mode: Mode, method: string, path: string, body = ""): Record<string, string> {
  const ts = Date.now().toString();
  
  if (mode === "A") {
    // Basit: X-PCK, X-Stamp, X-Signature = HMAC(secret, ts)
    return {
      "X-PCK": apiKey,
      "X-Stamp": ts,
      "X-Signature": hmacHex(apiSecret, ts),
      "Content-Type": "application/json"
    };
  }
  
  if (mode === "B") {
    // Gelişmiş: prehash = ts + method + path + sha256(body)
    const bodySha = sha256Hex(body || "");
    const pre = ts + method.toUpperCase() + path + bodySha;
    return {
      "X-PCK": apiKey,
      "X-Stamp": ts,
      "X-Content-SHA256": bodySha,
      "X-Signature": hmacHex(apiSecret, pre),
      "Content-Type": "application/json"
    };
  }
  
  // C: prehash = apiKey + ts (bazı örnek varyantları)
  return {
    "X-PCK": apiKey,
    "X-Stamp": ts,
    "X-Signature": hmacHex(apiSecret, apiKey + ts),
    "Content-Type": "application/json"
  };
}

async function callOnce(mode: Mode): Promise<Rec> {
  const url = new URL(base + pth);
  const hdr = headersFor(mode, "GET", url.pathname, "");
  const t0 = performance.now();
  
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      protocol: url.protocol,
      method: "GET",
      headers: hdr
    }, (r) => {
      let d = "";
      r.on("data", c => d += c);
      r.on("end", () => res({
        mode,
        try: 0,
        code: r.statusCode || 0,
        ms: performance.now() - t0,
        body: d.slice(0, 200)
      }));
    });
    req.on("error", rej);
    req.end();
  });
}

async function runMode(mode: Mode) {
  let last: Rec | undefined;
  
  for (let i = 0; i < N; i++) {
    if (circuitOpen) {
      return;
    }
    
    const r = await callOnce(mode);
    r.try = i + 1;
    out[mode].push(r);
    
    if ([500, 502, 503, 504].includes(r.code)) {
      retries++;
      if (i + 1 < N) {
        const sl = 200 * (i + 1) + Math.floor(Math.random() * 300);
        await new Promise(r => setTimeout(r, sl));
      }
    } else if (r.code === 429) {
      retries++;
      if (i + 1 < N) {
        const sl = 300 * (i + 1) + Math.floor(Math.random() * 400);
        await new Promise(r => setTimeout(r, sl));
      }
    } else {
      last = r;
      break;
    }
  }
  
  // circuit: iki ardışık 5xx
  const arr = out[mode];
  if (arr.length >= 2 && [500, 502, 503, 504].includes(arr[arr.length - 1].code) && [500, 502, 503, 504].includes(arr[arr.length - 2].code)) {
    circuitOpen = 1;
  }
}

function pctl(xs: number[], q: number): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
}

(async () => {
  if (!apiKey || !apiSecret) {
    const idx = {
      status: "PARTIAL",
      reason: "MISSING_KEYS",
      btcturk: {
        mode_ok: "NONE",
        codes: { A: null, B: null, C: null },
        auth_p95_ms: null
      },
      guardrails: {
        retries: 0,
        circuit_open: 0
      }
    };
    fs.writeFileSync(process.argv[2], JSON.stringify(idx, null, 2));
    process.exit(0);
  }
  
  for (const m of ["A", "B", "C"] as Mode[]) {
    await runMode(m);
  }
  
  const p95All = pctl([].concat(...(Object.values(out).map(v => v.map(x => x.ms)))) as number[], 0.95);
  const codes = {
    A: out.A.at(-1)?.code ?? null,
    B: out.B.at(-1)?.code ?? null,
    C: out.C.at(-1)?.code ?? null
  };
  const mode_ok = (["A", "B", "C"] as Mode[]).find(m => out[m].at(-1)?.code === 200) || "NONE";
  
  const idx = {
    status: mode_ok === "NONE" ? "PARTIAL" : "OK",
    reason: mode_ok === "NONE" ? "AUTH_INVALID_OR_UNVERIFIED" : "",
    btcturk: {
      endpoint: pth,
      mode_ok,
      codes,
      auth_p95_ms: p95All
    },
    guardrails: {
      retries,
      circuit_open: circuitOpen
    }
  };
  
  fs.writeFileSync(process.argv[2], JSON.stringify(idx, null, 2));
  fs.writeFileSync(process.argv[3], JSON.stringify({ A: out.A, B: out.B, C: out.C }, null, 2));
})().catch(e => {
  const idx = { status: "ERROR", reason: String(e?.message || e) };
  fs.writeFileSync(process.argv[2], JSON.stringify(idx, null, 2));
  process.exit(1);
}); 