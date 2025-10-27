export type Side = 'BUY' | 'SELL';
export type TIF = 'GTC' | 'IOC';

export interface BookLevel {
  price: number;
  qty: number;
}

export interface OrderBookSide {
  levels: BookLevel[]; // sorted best→worst
}

export interface MatchFill {
  price: number;
  qty: number;
}

export interface MatchResult {
  filledQty: number;
  avgPrice: number;
  remaining: number;
  fills: MatchFill[];
}

/** Market: karşı taraftan seviyeleri tüket, ilk fiyat referansına göre max slippage bps aşılırsa dur. */
export function matchMarket(qty: number, side: Side, opp: OrderBookSide, maxSlippageBps: number): MatchResult {
  let remaining = qty, notional = 0, filled = 0;
  const fills: MatchFill[] = [];
  
  if (!opp.levels.length) return { filledQty: 0, avgPrice: 0, remaining, fills };
  
  const p0 = opp.levels[0]?.price;
  if (p0 === undefined) return { filledQty: 0, avgPrice: 0, remaining, fills };
  
  for (const lvl of opp.levels) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, Math.max(0, lvl.qty));
    if (take <= 0) continue;
    
    // slippage guard (ilk seviyeye göre)
    const bps = Math.abs(((lvl.price - p0) / p0) * 1e4);
    if (bps > maxSlippageBps) break;
    
    fills.push({ price: lvl.price, qty: take });
    remaining -= take;
    filled += take;
    notional += lvl.price * take;
  }
  
  return { filledQty: filled, avgPrice: filled ? notional / filled : 0, remaining, fills };
}

/** Limit: karşı tarafta daha iyi/eşit fiyatı çarp; GTC ise kalan pending, IOC ise kalan iptal. */
export function matchLimit(limit: number, qty: number, side: Side, opp: OrderBookSide, tif: TIF): MatchResult {
  let remaining = qty, notional = 0, filled = 0;
  const fills: MatchFill[] = [];
  const crosses = (price: number) => side === 'BUY' ? price <= limit : price >= limit;
  
  for (const lvl of opp.levels) {
    if (remaining <= 0) break;
    if (!crosses(lvl.price)) break;
    
    const take = Math.min(remaining, Math.max(0, lvl.qty));
    if (take <= 0) continue;
    
    fills.push({ price: lvl.price, qty: take });
    remaining -= take;
    filled += take;
    notional += lvl.price * take;
  }
  
  if (tif === 'IOC') remaining = 0;
  return { filledQty: filled, avgPrice: filled ? notional / filled : 0, remaining, fills };
}

/** Stop tetikleyici (last price): BUY stop için >=, SELL stop için <= */
export function triggerStop(side: Side, stop: number, last: number): boolean {
  return side === 'BUY' ? (last >= stop) : (last <= stop);
} 