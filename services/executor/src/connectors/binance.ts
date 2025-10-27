import crypto from "node:crypto";

const BASE = (process.env.BINANCE_TESTNET?.trim()==='1')
  ? 'https://testnet.binance.vision'
  : 'https://api.binance.com';

const headers = () => ({ 'X-MBX-APIKEY': String(process.env.BINANCE_API_KEY||'') });

function sign(query: string): string {
  const key = String(process.env.BINANCE_API_SECRET||'');
  return crypto.createHmac('sha256', key).update(query).digest('hex');
}

async function http(path: string, method='GET', qs: Record<string,any>={}, signed=false) {
  const q = new URLSearchParams();
  for (const [k,v] of Object.entries(qs)) if (v!==undefined && v!==null) q.set(k, String(v));
  if (signed) {
    q.set('timestamp', String(Date.now()));
    if (process.env.BINANCE_RECV_WINDOW) q.set('recvWindow', String(process.env.BINANCE_RECV_WINDOW));
    q.set('signature', sign(q.toString()));
  }
  const url = `${BASE}${path}?${q.toString()}`;
  const res = await fetch(url, { method, headers: signed ? headers() : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error('binance_error'), { status:res.status, body:json });
  return json;
}

export async function getServerTime(){ return http('/api/v3/time'); }
export async function getExchangeInfo(symbol: string){
  return http('/api/v3/exchangeInfo', 'GET', { symbol });
}

export async function placeMarketOrder(symbol: string, side: 'BUY'|'SELL', quantity: number){
  return http('/api/v3/order', 'POST', { symbol, side, type:'MARKET', quantity }, true);
}

export async function getOrderStatus(symbol:string, opts:{ orderId?: number; origClientOrderId?: string }){
  const params:any = { symbol };
  if (process.env.BINANCE_RECV_WINDOW) params.recvWindow = Number(process.env.BINANCE_RECV_WINDOW);
  if (opts?.orderId) params.orderId = opts.orderId;
  if (opts?.origClientOrderId) params.origClientOrderId = opts.origClientOrderId;
  return http('/api/v3/order', 'GET', params, true);
}

/**
 * Binance spot account balance bilgilerini çeker
 * @returns Account information including balances array
 */
export async function getAccountBalances(){
  return http('/api/v3/account', 'GET', {}, true);
}

/**
 * Binance'de belirli sembol için güncel fiyat bilgisini çeker
 * @param symbol - Sembol ismi (örn: BTCUSDT)
 */
export async function getTickerPrice(symbol: string){
  return http('/api/v3/ticker/price', 'GET', { symbol });
}

/**
 * Tüm semboller için güncel fiyatları çeker
 */
export async function getAllTickerPrices(){
  return http('/api/v3/ticker/price', 'GET');
} 