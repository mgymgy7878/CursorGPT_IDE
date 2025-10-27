export type BISTTick = { iseq:string; ts:number; bid?:number; ask?:number; last?:number; vol?:number };
export async function readBISTSnapshotStub(): Promise<BISTTick[]> { return []; }
export function normalizeBISTTick(t:Partial<BISTTick>):BISTTick{
	return { iseq: String(t.iseq||'UNKNOWN'), ts: Number(t.ts||Date.now()), bid: t.bid, ask: t.ask, last: t.last, vol: t.vol };
} 