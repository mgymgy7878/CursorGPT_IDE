import crypto from 'crypto';

export type Env = 'testnet'|'live';

export class BinanceFutures {
  constructor(private opts: { apiKey: string; apiSecret: string; env: Env; baseTest?: string; baseLive?: string }) {}

  base() {
    return this.opts.env === 'live' ? (this.opts.baseLive || process.env.BINANCE_FAPI_BASE_LIVE || 'https://fapi.binance.com')
                                    : (this.opts.baseTest || process.env.BINANCE_FAPI_BASE_TESTNET || 'https://testnet.binancefuture.com');
  }

  private sign(query: string) {
    return crypto.createHmac('sha256', this.opts.apiSecret).update(query).digest('hex');
  }

  async public(path: string, qs?: Record<string, any>) {
    const url = new URL(this.base() + path);
    for (const [k,v] of Object.entries(qs||{})) url.searchParams.set(k, String(v));
    const r = await fetch(url.toString());
    return r.json();
  }

  async signed(method: 'GET'|'POST'|'DELETE', path: string, qs?: Record<string, any>) {
    const url = new URL(this.base() + path);
    const q = new URLSearchParams();
    for (const [k,v] of Object.entries(qs||{})) if (v !== undefined) q.set(k, String(v));
    q.set('timestamp', String(Date.now()));
    const sig = this.sign(q.toString());
    q.set('signature', sig);

    const target = method === 'GET' ? `${url.toString()}?${q}` : url.toString();
    const init: any = {
      method,
      headers: { 'X-MBX-APIKEY': this.opts.apiKey, 'content-type': 'application/x-www-form-urlencoded' },
      body: method === 'GET' ? undefined : q.toString()
    };
    const r = await fetch(target, init);
    const text = await r.text();
    try { return JSON.parse(text); } catch { return { status: r.status, text }; }
  }

  // Basit bağlantı testi (bakiye/futures account)
  async testAuth() {
    return this.signed('GET', '/fapi/v2/balance');
  }

  // Market order örneği (USDT-M)
  async market(symbol: string, side: 'BUY'|'SELL', quantity: number) {
    return this.signed('POST', '/fapi/v1/order', { symbol, side, type: 'MARKET', quantity });
  }
}
