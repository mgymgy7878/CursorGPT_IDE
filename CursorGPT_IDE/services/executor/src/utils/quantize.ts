type Filters = { stepSize?: number; minQty?: number; tickSize?: number };
export function parseFilters(info: any): Filters {
	const f = (info?.symbols?.[0]?.filters ?? []) as any[];
	const lot = f.find(x=>x?.filterType==='LOT_SIZE') ?? {};
	const tick = f.find(x=>x?.filterType==='PRICE_FILTER') ?? {};
	return {
		stepSize: lot?.stepSize ? Number(lot.stepSize) : undefined,
		minQty: lot?.minQty ? Number(lot.minQty) : undefined,
		tickSize: tick?.tickSize ? Number(tick.tickSize) : undefined,
	};
}
export function quantizeQty(qty: number, step?: number, min?: number){
	let q = qty;
	if (step && step>0) q = Math.floor(q/step)*step;
	if (min && q<min) q = min;
	return Number(q.toFixed(12));
} 