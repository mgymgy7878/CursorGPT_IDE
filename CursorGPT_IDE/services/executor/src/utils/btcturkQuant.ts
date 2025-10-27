/** Quantize helpers for BTCTurk using /api/v2/server/exchangeinfo */
export type PairInfo = {
	name:string; numeratorScale:number; denominatorScale:number;
	minExchangeValue?: number; minimumOrderPrice?: number; maximumOrderPrice?: number;
};
export function pickPair(info:any, name:string): PairInfo|undefined{
	const xs = (info?.data || info?.pairs || info?.Symbols || info?.symbols || []);
	const row = xs.find((x:any)=>x?.name===name || x?.pair===name || x?.symbol===name);
	if(!row) return;
	return {
		name: String(row.name||row.pair||row.symbol),
		numeratorScale: Number(row.numeratorScale ?? row.quantityScale ?? 8),
		denominatorScale: Number(row.denominatorScale ?? row.pairScale ?? 2),
		minExchangeValue: row.minExchangeValue ?? row.minAmount,
		minimumOrderPrice: row.minimumOrderPrice ?? row.minPrice,
		maximumOrderPrice: row.maximumOrderPrice ?? row.maxPrice,
	};
}
export function qQty(q:number, scale:number){ const f = Math.pow(10, scale); return Math.floor(q*f)/f; }
export function qPrice(p:number, scale:number){ const f = Math.pow(10, scale); return Math.round(p*f)/f; } 