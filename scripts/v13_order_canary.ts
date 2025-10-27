import crypto from "crypto";
import fs from "fs";
import https from "https";

const base = process.env.BASE || "https://testnet.binance.vision";
const key = process.env.API_KEY || "";
const sec = process.env.API_SECRET || "";
const symbol = process.env.SYMBOL || "BTCUSDT";
const qty = process.env.QTY || "0.00015";
const N = parseInt(process.env.N || "3", 10);

const S: any = {
  status: "INIT",
  reason: "",
  orderflow: {
    n: 0,
    symbol,
    qty,
    place_ack_ms: [],
    place_ack_p95_ms: null,
    event_db_p95_ms: null
  }
};

if (!key || !sec) {
  S.status = "SKIPPED";
  S.reason = "MISSING_KEYS";
  fs.writeFileSync(process.argv[2], JSON.stringify(S, null, 2));
  process.exit(0);
}

const h = (q: string) => crypto.createHmac("sha256", sec).update(q).digest("hex");

function req(path: string, method = "GET", params: any = {}): Promise<any> {
  const url = new URL(base + path);
  const opt: any = {
    method,
    headers: {
      "X-MBX-APIKEY": key,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };

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

(async () => {
  await req("/api/v3/time", "GET");

  for (let i = 0; i < N; i++) {
    const t0 = Date.now();
    const o = await req("/api/v3/order", "POST", {
      symbol,
      side: "BUY",
      type: "MARKET",
      quantity: qty,
      newClientOrderId: `V13_${Date.now()}_${i}`
    });
    const dt = Date.now() - t0;
    S.orderflow.place_ack_ms.push(dt);
    S.orderflow.n++;
  }

  try {
    await req("/api/v3/openOrders", "DELETE", { symbol });
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