// import fetch from "node-fetch";

let cache: any = null;
let cacheAt = 0;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getExchangeInfo(baseUrl: string) {
  const now = Date.now();
  if (cache && (now - cacheAt) < TTL_MS) return cache;
  
  // Mock exchange info for now
  cache = {
    symbols: [
      {
        symbol: 'BTCUSDT',
        status: 'TRADING',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        baseAssetPrecision: 8,
        quoteAssetPrecision: 8,
        filters: [
          { filterType: 'PRICE_FILTER', minPrice: '0.01', maxPrice: '1000000', tickSize: '0.01' },
          { filterType: 'LOT_SIZE', minQty: '0.00001', maxQty: '1000', stepSize: '0.00001' },
          { filterType: 'MIN_NOTIONAL', minNotional: '10' }
        ]
      }
    ]
  };
  cacheAt = now;
  return cache;
}

export function getSymbolFilters(info: any, symbol: string) {
  const s = info.symbols?.find((x: any) => x.symbol === symbol);
  if (!s) throw new Error('SYMBOL_NOT_FOUND');
  
  const pf = (t: string) => s.filters.find((f: any) => f.filterType === t);
  
  return {
    priceFilter: pf('PRICE_FILTER'),
    lotSize: pf('LOT_SIZE'),
    minNotional: pf('MIN_NOTIONAL'),
    baseAssetPrecision: s.baseAssetPrecision,
    quoteAssetPrecision: s.quoteAssetPrecision
  };
}

export function clampToStep(v: string, step: string) {
  const d = (step.split('.')[1] || '').length;
  return Number(v).toFixed(d);
}

export function validateMinNotional(price: string, quantity: string, minNotional: string) {
  const notion = Number(price) * Number(quantity);
  return notion >= Number(minNotional);
} 