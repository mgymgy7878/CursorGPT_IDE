export type StrategyStatus = "running" | "paused" | "stopped";
export type StrategyRow = {
  id: string; name: string; status: StrategyStatus; pl: number; _timer?: ReturnType<typeof setInterval>|null;
};

const REGISTRY = new Map<string, StrategyRow>();
const listeners = new Set<(row: StrategyRow) => void>();

export function onChange(cb: (row: StrategyRow)=>void){ listeners.add(cb); return ()=>listeners.delete(cb); }
function emit(row: StrategyRow){ for(const cb of listeners){ cb(row); } }

export function listStrategies(){ return Array.from(REGISTRY.values()).map(({_timer, ...r})=>r); }

export function startStrategy(id: string, name?: string){
  const row = REGISTRY.get(id) ?? { id, name: name ?? id, status: "stopped", pl: 0, _timer: null };
  if (row._timer) clearInterval(row._timer as any);
  row.status = "running";
  row._timer = setInterval(() => {
    row.pl = +(row.pl + (Math.random()-0.5)*10).toFixed(2);
    emit({...row});
  }, 1000);
  REGISTRY.set(id, row);
  emit({...row});
  return { ok: true, row: {...row, _timer: undefined} };
}

export function pauseStrategy(id: string){
  const row = REGISTRY.get(id); if(!row) return { ok:false, msg:"not found" };
  row.status = "paused";
  if (row._timer){ clearInterval(row._timer as any); row._timer = null; }
  emit({...row});
  return { ok:true, row: {...row, _timer: undefined} };
}

export function stopStrategy(id: string){
  const row = REGISTRY.get(id); if(!row) return { ok:false, msg:"not found" };
  row.status = "stopped";
  if (row._timer){ clearInterval(row._timer as any); row._timer = null; }
  row.pl = 0;
  emit({...row});
  return { ok:true, row: {...row, _timer: undefined} };
}


