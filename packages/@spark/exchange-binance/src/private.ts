import crypto from "crypto";
import { URLSearchParams } from "url";
// import fetch from "node-fetch";
import type { PrivateExchange, PlaceOrderParams, ExchangeCapabilities } from "@spark/exchange-core";

type Method = 'GET' | 'POST' | 'DELETE';

export interface PrivateClientOpts {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;          // https://testnet.binance.vision
  timeoutMs: number;        // 7000
  retries: number;          // 3
  clockDriftMs: number;     // 0
  qps: number;              // 8
}

export class BinancePrivate implements PrivateExchange {
  constructor(private opts: PrivateClientOpts) {}

  capabilities(): ExchangeCapabilities {
    return { 
      nativeIceberg: true, 
      supportsReplace: true, 
      cancelAllRequiresSymbol: true 
    };
  }

  private sign(query: string) {
    return crypto.createHmac('sha256', this.opts.apiSecret).update(query).digest('hex');
  }

  private async _fetch(path: string, method: Method, body?: URLSearchParams) {
    const url = `${this.opts.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'X-MBX-APIKEY': this.opts.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.opts.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? body.toString() : undefined,
        signal: controller.signal,
      });
      const txt = await res.text();
      let json: any;
      try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status} ${res.statusText} :: ${txt}`);
        throw err;
      }
      return json;
    } finally {
      clearTimeout(id);
    }
  }

  private async callSigned(method: Method, path: string, params: Record<string, string | number>) {
    const timestamp = Date.now() + this.opts.clockDriftMs;
    const recvWindow = 5000;

    const usp = new URLSearchParams();
    for (const [k,v] of Object.entries(params)) usp.append(k, String(v));
    usp.append('timestamp', String(timestamp));
    usp.append('recvWindow', String(recvWindow));

    const signature = this.sign(usp.toString());
    usp.append('signature', signature);

    let lastErr: any;
    for (let i=0; i<=this.opts.retries; i++) {
      try {
        return await this._fetch(path, method, usp);
      } catch (e: any) {
        lastErr = e;
        // basit backoff
        await new Promise(r => setTimeout(r, 300 * (i + 1)));
      }
    }
    throw lastErr;
  }

  // ---- PUBLIC METHODS ----
  health() {
    return { adapter: 'binance', mode: 'testnet', status: 'ok' };
  }

  async account() {
    return this.callSigned('GET', '/api/v3/account', {});
  }

  async openOrders(params?: {symbol?:string}) {
    const p: Record<string, string> = {};
    if (params?.symbol) p.symbol = params.symbol;
    return this.callSigned('GET', '/api/v3/openOrders', p);
  }

  async newOrder(params: PlaceOrderParams) {
    // price/qty clamp + idempotency mevcut akışa ekli
    return this.callSigned('POST', '/api/v3/order', params as any);
  }

  async cancelOrder(params: { symbol: string; orderId?: string; origClientOrderId?: string; }) {
    return this.callSigned('DELETE', '/api/v3/order', params as any);
  }

  async cancelAllOpenOrders(params: { symbol: string }) {
    return this.callSigned('DELETE', '/api/v3/openOrders', params as any);
  }
} 