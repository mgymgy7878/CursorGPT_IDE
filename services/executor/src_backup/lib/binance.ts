import crypto from "node:crypto";

type OrderReq = {
  symbol: string; // "BTCUSDT"
  side: "BUY" | "SELL";
  type: "MARKET";
  quantity?: number;      // for spot MARKET in base asset
  quoteOrderQty?: number; // alternative: quote amount
};

function qs(params: Record<string, any>) {
  return Object.entries(params)
    .filter(([,v]) => v !== undefined && v !== null)
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

function sign(query: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

export async function postOrder(req: OrderReq, apiKey: string, apiSecret: string, baseUrl?: string, recvWindow = 5000) {
  const ts = Date.now();
  const urlBase = baseUrl || process.env.BINANCE_MAINNET_BASE || "https://api.binance.com";
  const path = "/api/v3/order";
  const payload: any = {
    symbol: req.symbol.toUpperCase(),
    side: req.side,
    type: req.type,
    timestamp: ts,
    recvWindow
  };
  if (req.quantity) payload.quantity = req.quantity;
  if (req.quoteOrderQty) payload.quoteOrderQty = req.quoteOrderQty;

  const query = qs(payload);
  const signature = sign(query, apiSecret);
  const full = `${urlBase}${path}?${query}&signature=${signature}`;

  const r = await fetch(full, {
    method: "POST",
    headers: {
      "X-MBX-APIKEY": apiKey,
      "content-type": "application/x-www-form-urlencoded"
    }
  });
  const text = await r.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!r.ok) {
    const code = (json && (json.code ?? r.status)) || "exchange_error";
    const msg = (json && (json.msg ?? r.statusText)) || "exchange_error";
    const err: any = new Error(msg);
    err.code = code;
    err.status = r.status;
    err.body = json;
    throw err;
  }
  return json; // includes orderId, transactTime, etc.
} 