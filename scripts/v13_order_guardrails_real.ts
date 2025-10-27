import crypto from "crypto";
import https from "https";
import fs from "fs";

const base = process.env.BASE || "https://testnet.binance.vision";
const key = process.env.API_KEY || "";
const sec = process.env.API_SECRET || "";
const symbol = process.env.SYMBOL || "BTCUSDT";
const qty = parseFloat(process.env.QTY || "0.00015");
const N = parseInt(process.env.N || "3", 10);
const MAXN = parseFloat(process.env.MAX_NOTIONAL_USDT || "20");

const S: any = {
  status: "INIT",
  reason: "",
  orderflow: {
    n: 0,
    symbol,
    qty,
    price_usdt: null,
    place_ack_ms: [],
    place_ack_p95_ms: null,
    retries: 0,
    errors: 0
  },
  guardrails: {
    max_notional_usdt: MAXN,
    blocked_count: 0,
    kill_switch: 0
  }
};

if (!key || !sec) {
  S.status = "SKIPPED";
  S.reason = "MISSING_KEYS";
  fs.writeFileSync(process.argv[2], JSON.stringify(S, null, 2));
  process.exit(0);
}

const h = (q: string) => crypto.createHmac("sha256", sec).update(q).digest("hex");

function req(path: string, method = "GET", params: any = {}, signed = false): Promise<any> {
  const url = new URL(base + path);
  const opt: any = { method, headers: { "Content-Type": "application/x-www-form-urlencoded" } };
  if (signed) opt.headers["X-MBX-APIKEY"] = key;
  
  return new Promise((res, rej) => {
    const r = https.request(method === "GET" ? url : (base + path), opt, rr => {
      let d = "";
      rr.on("data", c => d += c);
      rr.on("end", () => {
        try {
          res(JSON.parse(d));
        } catch {
          res({ raw: d, code: rr.statusCode });
        }
      });
    });
    r.on("error", rej);
    if (method !== "GET") {
      const ts = Date.now();
      const qp = new URLSearchParams({ ...params, timestamp: String(ts) }).toString();
      r.write(qp + `&signature=${h(qp)}`);
    }
    r.end();
  });
}

const pctl = (xs: number[], q: number) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
};

(async () => {
  // Price for notional calc (public endpoint)
  try {
    const t = await req(`/api/v3/ticker/price?symbol=${symbol}`, "GET");
    const p = parseFloat(t.price || "0");
    S.orderflow.price_usdt = Number.isFinite(p) && p > 0 ? p : 60000;
  } catch {
    S.orderflow.price_usdt = 60000;
  }
  await req("/api/v3/time", "GET"); // warmup

  let notion = 0;
  for (let i = 0; i < N; i++) {
    const notional = (S.orderflow.price_usdt || 0) * qty;
    if (S.guardrails.kill_switch || notion + notional > MAXN) {
      S.guardrails.blocked_count++;
      S.guardrails.kill_switch = 1;
      continue;
    }
    const t0 = Date.now();
    try {
      const o = await req("/api/v3/order", "POST", {
        symbol,
        side: "BUY",
        type: "MARKET",
        quantity: qty,
        newClientOrderId: `V13G_${Date.now()}_${i}`
      }, true);
      const dt = Date.now() - t0;
      S.orderflow.place_ack_ms.push(dt);
      S.orderflow.n++;
      notion += notional;
    } catch (e: any) {
      S.orderflow.errors++;
    }
  }
  
  try {
    await req("/api/v3/openOrders", "DELETE", { symbol }, true);
  } catch {}

  const xs = [...S.orderflow.place_ack_ms].sort((a: number, b: number) => a - b);
  S.orderflow.place_ack_p95_ms = xs.length ? xs[Math.min(xs.length - 1, Math.floor(0.95 * xs.length))] : null;
  S.status = "OK";
  S.reason = "";
  fs.writeFileSync(process.argv[2], JSON.stringify(S, null, 2));
})().catch(e => {
  S.status = "ERROR";
  S.reason = String(e?.message || e);
  fs.writeFileSync(process.argv[2], JSON.stringify(S, null, 2));
  process.exit(1);
}); 