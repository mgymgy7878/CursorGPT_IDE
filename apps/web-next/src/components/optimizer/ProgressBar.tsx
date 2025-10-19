"use client";
export default function ProgressBar(
  { pct, status, best, etaSecs, etaUncertain }:
  { pct:number; status:'idle'|'running'|'done'|'error'; best?:any; etaSecs?: number; etaUncertain?: boolean }
){
  const p = Math.max(0, Math.min(100, Math.floor(pct||0)));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="muted text-xs">İlerleme: {p}%</div>
        <div className="flex items-center gap-2">
          {typeof etaSecs === 'number' && etaSecs > 0 && status==='running' && (
            <span className="text-xs text-neutral-300" aria-label="Tahmini kalan süre">
              {etaUncertain ? '~ ' : '≈ '}
              {formatEta(etaSecs)}
            </span>
          )}
          <span className={`text-xs ${status==='done'?'text-green-400': status==='error'?'text-red-400':'text-neutral-400'}`}>{status}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-700 rounded overflow-hidden">
        <div className="h-2 bg-gray-300" style={{ width: `${p}%` }} />
      </div>
      {best && (
        <div className="muted text-xs mt-1">Best: {JSON.stringify(best)}</div>
      )}
    </div>
  );
}

function formatEta(totalSecs: number): string{
  const sec = Math.max(0, Math.round(totalSecs));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const pad = (n:number)=> String(n).padStart(2,'0');
  return `${m}:${pad(s)}`;
}


