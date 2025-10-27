import { useState } from "react";
import dynamic from "next/dynamic";
import { BacktestRunForm } from "./BacktestRunForm";
import { useBacktestStore } from "../stores/useBacktestStore";

const BacktestChart = dynamic(() => import('../components/BacktestChart'), { ssr: false }) as any;

function formatPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(2)}%`;
}
function formatNum(n: number | null | undefined, d = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  const f = (n as any).toFixed ? (n as any).toFixed(d) : n;
  return String(f);
}

export function BacktestPanel() {
  const { result, error } = useBacktestStore();

  const pnl = (result as any)?.totalPnl ?? (result as any)?.totalReturn ?? 0;
  const maxDD = (result as any)?.maxDrawdown ?? 0;
  const winRate = (result as any)?.winRate ?? 0;
  const sharpe = (result as any)?.sharpe ?? (result as any)?.sharpeRatio ?? null;
  const trades = (result as any)?.trades ?? [];

  function exportTradesCsv(trades: any[]) {
    const headers = ['entryTime','exitTime','side','qty','entryPrice','exitPrice','pnl'];
    const rows = trades.map(t => [t.entryTime,t.exitTime,t.side,t.qty,t.entryPrice,t.exitPrice,t.pnl].join(','));
    const blob = new Blob([headers.join(',')+'\n'+rows.join('\n')], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'trades.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display:'grid', gap:12 }}>
      <div className="panel" style={{ padding:12, display:'grid', gap:8 }}>
        <BacktestRunForm />
        {error && <div className="panel" style={{ padding: 8, borderColor:'#ef4444' }}>Hata: {error}</div>}

        <div style={{ display:'flex', gap:10, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(120px, 1fr))', gap:8, flex:1, minWidth:520 }}>
            <div className="kpi"><div>PnL</div><strong>{formatNum(pnl)}</strong></div>
            <div className="kpi"><div>Max DD</div><strong>{formatPct(maxDD)}</strong></div>
            <div className="kpi"><div>WinRate</div><strong>{((winRate*100)||0).toFixed(1)}%</strong></div>
            <div className="kpi"><div>Sharpe</div><strong>{sharpe ?? '—'}</strong></div>
            <div className="kpi"><div>Trades</div><strong>{trades?.length ?? 0}</strong></div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {trades?.length ? <button className="btn" onClick={()=>exportTradesCsv(trades)}>CSV indir</button> : null}
          </div>
        </div>
      </div>

      {result ? (
        <div className="panel" style={{ padding: 8 }}>
          <BacktestChart data={result} />
        </div>
      ) : <div className="panel" style={{ padding: 16, opacity:.8 }}>Henüz backtest sonucu yok. Formdan çalıştır.</div>}

      <style jsx global>{`
        .kpi { background:#fff; border:1px solid rgba(0,0,0,.06); border-radius:10px; padding:10px }
        .kpi > div { font-size:12px; color:#6b7280; }
        .kpi > strong { font-size:16px; }
      `}</style>
    </div>
  );
}

export default BacktestPanel; 
