import crypto from "node:crypto";

type HttpMethod = "GET" | "POST" | "DELETE" | "PUT";
interface ClientOpts {
  baseUrl: string;      // e.g., https://testnet.binancefuture.com
  prefix?: string;      // e.g., /fapi/v1 (USDT-M)
  apiKey?: string;
  apiSecret?: string;
  recvWindow?: number;
}

export class BinanceFutures {
  private baseUrl: string;
  private prefix: string;
  private key?: string;
  private secret?: string;
  private recvWindow: number;

  constructor(opts: ClientOpts) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/,"");
    this.prefix  = (opts.prefix ?? "/fapi/v1").replace(/\/?$/,"");
    this.key     = opts.apiKey;
    this.secret  = opts.apiSecret;
    this.recvWindow = opts.recvWindow ?? 5000;
  }

  private sign(params: URLSearchParams) {
    if (!this.secret) throw new Error("Missing apiSecret");
    const sig = crypto.createHmac("sha256", this.secret)
      .update(params.toString())
      .digest("hex");
    params.set("signature", sig);
  }

  private async request<T>(method: HttpMethod, path: string, qs?: Record<string, any>, signed=false): Promise<T> {
    const params = new URLSearchParams();
    if (qs) {
      for (const [k,v] of Object.entries(qs)) {
        if (v !== undefined && v !== null) params.append(k, String(v));
      }
    }
    if (signed) {
      params.set("timestamp", String(Date.now()));
      params.set("recvWindow", String(this.recvWindow));
      this.sign(params);
    }
    const url = `${this.baseUrl}${this.prefix}${path}${params.size ? `?${params.toString()}` : ""}`;
    const headers: Record<string,string> = {};
    if (signed && this.key) headers["X-MBX-APIKEY"] = this.key;

    const res = await fetch(url, { method, headers } as any);
    const text = await res.text();
    let data: any; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw:text }; }
    if (!res.ok) {
      const msg = (data && (data.msg||data.message)) || `HTTP ${res.status}`;
      throw new Error(`[BinanceFutures] ${method} ${path} failed: ${msg}`);
    }
    return data as T;
  }

  // For endpoints that require only API key (no signature), e.g., userDataStream listenKey lifecycle
  private async requestKeyed<T>(method: HttpMethod, path: string, qs?: Record<string, any>): Promise<T> {
    const params = new URLSearchParams();
    if (qs) {
      for (const [k,v] of Object.entries(qs)) {
        if (v !== undefined && v !== null) params.append(k, String(v));
      }
    }
    const url = `${this.baseUrl}${this.prefix}${path}${params.size ? `?${params.toString()}` : ""}`;
    const headers: Record<string,string> = {};
    if (this.key) headers["X-MBX-APIKEY"] = this.key;
    const res = await fetch(url, { method, headers } as any);
    const text = await res.text();
    let data: any; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw:text }; }
    if (!res.ok) {
      const msg = (data && (data.msg||data.message)) || `HTTP ${res.status}`;
      throw new Error(`[BinanceFutures] ${method} ${path} failed: ${msg}`);
    }
    return data as T;
  }

  // ---- Public
  time()            { return this.request<{serverTime:number}>("GET", "/time"); }
  exchangeInfo(q: {symbol?:string} = {}) { return this.request("GET","/exchangeInfo", q); }
  klines(q: {symbol:string, interval:string, limit?:number, startTime?:number, endTime?:number}) {
    return this.request("GET","/klines", q);
  }
  bookTicker(q:{symbol:string}) { return this.request("GET","/ticker/bookTicker", q); }

  // ---- Signed / Account
  account()        { return this.request("GET","/account", undefined, true); }
  positionRisk(q?:{symbol?:string}) { return this.request("GET","/positionRisk", q, true); }

  // ---- Orders
  createOrder(b: {
    symbol: string, side: "BUY"|"SELL",
    type: "MARKET"|"LIMIT",
    quantity?: string, price?: string,
    timeInForce?: "GTC"|"IOC"|"FOK",
    newClientOrderId?: string
  }) {
    return this.request("POST","/order", b as any, true);
  }
  cancelOrder(q:{symbol:string, orderId?:number, origClientOrderId?:string}) {
    return this.request("DELETE","/order", q, true);
  }
  getOrder(q:{symbol:string, orderId?:number, origClientOrderId?:string}) {
    return this.request("GET","/order", q, true);
  }
  openOrders(q:{symbol?:string}) {
    return this.request("GET","/openOrders", q, true);
  }

  // ---- User Data Stream (API key only)
  createListenKey() { return this.requestKeyed<{ listenKey: string }>("POST", "/listenKey"); }
  keepAliveListenKey(listenKey: string) { return this.requestKeyed("PUT", "/listenKey", { listenKey }); }
  closeListenKey(listenKey: string) { return this.requestKeyed("DELETE", "/listenKey", { listenKey }); }

  // ---- Leverage / Margin
  setLeverage(b:{symbol:string, leverage:number}) { return this.request("POST","/leverage", b as any, true); }
  setMarginType(b:{symbol:string, marginType:"ISOLATED"|"CROSSED"|"CROSS"}) {
    const mt = b.marginType === "CROSSED" ? "CROSSED" : (b.marginType === "CROSS" ? "CROSSED" : b.marginType);
    return this.request("POST","/marginType", {symbol:b.symbol, marginType:mt}, true);
  }
}

export function makeFuturesFromEnv() {
  const base = process.env.BINANCE_FUTURES_BASE_URL || "";
  const prefix = process.env.BINANCE_FUTURES_PREFIX || "/fapi/v1";
  return new BinanceFutures({
    baseUrl: base,
    prefix,
    apiKey: process.env.BINANCE_FUTURES_API_KEY,
    apiSecret: process.env.BINANCE_FUTURES_API_SECRET,
    recvWindow: Number(process.env.BINANCE_FUTURES_RECV_WINDOW ?? 5000),
  });
}

// Güvenli fabrika - client yoksa null döndür
export function makeFuturesFromEnvSafe(env = process.env) {
  const base = env.BINANCE_FUTURES_BASE_URL?.trim();
  const prefix = env.BINANCE_FUTURES_PREFIX?.trim() ?? '/fapi/v1';
  if (!base) return null;
  return new BinanceFutures({
    baseUrl: base,
    prefix,
    apiKey: env.BINANCE_FUTURES_API_KEY,
    apiSecret: env.BINANCE_FUTURES_API_SECRET,
    recvWindow: Number(env.BINANCE_FUTURES_RECV_WINDOW ?? 5000),
  });
}


