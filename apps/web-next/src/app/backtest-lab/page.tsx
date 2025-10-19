"use client";
import { useState } from "react";
import dynamic from 'next/dynamic';

// Dynamic imports for client-only components
const EquityCurveChart = dynamic(() => import('@/components/backtest/EquityCurveChart'), { ssr: false });
const MetricsCards = dynamic(() => import('@/components/backtest/MetricsCards'), { ssr: false });
const CorrelationHeatmap = dynamic(() => import('@/components/backtest/CorrelationHeatmap'), { ssr: false });

type TabType = 'single' | 'walkforward' | 'portfolio';

export default function BacktestLab(){
  const [j,setJ]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [tab,setTab]=useState<TabType>('single');
  
  async function runSingle(){
    setLoading(true);
    try {
      const body={
        symbol:(document.getElementById("sym") as any).value||"BTCUSDT",
        timeframe:(document.getElementById("tf") as any).value||"15m",
        start:(document.getElementById("s") as any).value||"2024-01-01",
        end:(document.getElementById("e") as any).value||"2024-01-15",
        exchange:(document.getElementById("ex") as any).value||"binance",
        futures: (document.getElementById("fu") as any).checked,
        useCache: true,
        config:{ 
          indicators:{ emaFast:20, emaSlow:50, atr:14 }, 
          entry:{ type:"crossUp", fast:"EMA", slow:"EMA" }, 
          exit:{ atrMult:2, takeProfitRR:1.5 }, 
          feesBps:5, 
          slippageBps:1 
        }
      };
      const r=await fetch("/api/backtest/run",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify(body)
      });
      setJ(await r.json());
    } catch(err) {
      setJ({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }
  
  async function runWalkForward(){
    setLoading(true);
    try {
      const body={
        symbol:(document.getElementById("sym") as any).value||"BTCUSDT",
        timeframe:(document.getElementById("tf") as any).value||"1h",
        start:(document.getElementById("s") as any).value||"2024-01-01",
        end:(document.getElementById("e") as any).value||"2024-03-01",
        exchange:(document.getElementById("ex") as any).value||"binance",
        useCache: true,
        config: { trainRatio: 0.6, validateRatio: 0.2, testRatio: 0.2, rollingWindow: false },
        strategy: { type:"emaCross", params:{ emaFast:20, emaSlow:50, atr:14 } }
      };
      const r=await fetch("/api/backtest/walkforward",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify(body)
      });
      setJ(await r.json());
    } catch(err) {
      setJ({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }
  
  async function runPortfolio(){
    setLoading(true);
    try {
      const syms = (document.getElementById("syms") as any).value?.split(',').map((s:string)=>s.trim()) || ["BTCUSDT","ETHUSDT"];
      const body={
        symbols: syms,
        timeframe:(document.getElementById("tf") as any).value||"1h",
        start:(document.getElementById("s") as any).value||"2024-01-01",
        end:(document.getElementById("e") as any).value||"2024-01-15",
        exchange:(document.getElementById("ex") as any).value||"binance",
        useCache: true,
        config: { correlation: { enabled: true, threshold: 0.7 } },
        strategy: { type:"emaCross", params:{ emaFast:20, emaSlow:50, atr:14 } }
      };
      const r=await fetch("/api/backtest/portfolio",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify(body)
      });
      setJ(await r.json());
    } catch(err) {
      setJ({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }
  
  const run = tab === 'single' ? runSingle : tab === 'walkforward' ? runWalkForward : runPortfolio;
  
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold mb-2">📊 Backtest Lab</h1>
        <p className="text-sm opacity-70">Geçmiş veri üzerinde strateji performansını test edin</p>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'single', label: '📈 Tek Asset' },
          { id: 'walkforward', label: '🔄 Walk-Forward' },
          { id: 'portfolio', label: '💼 Portföy' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {setTab(t.id as TabType); setJ(null);}}
            className={`px-4 py-2 rounded-xl border transition ${
              tab === t.id 
                ? 'border-green-500 bg-green-950/30 text-green-400' 
                : 'border-neutral-700 hover:bg-neutral-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      {/* Common Inputs */}
      <div className="grid md:grid-cols-6 gap-2">
        {tab === 'portfolio' ? (
          <input 
            id="syms" 
            placeholder="Symbols (BTCUSDT,ETHUSDT,BNBUSDT)" 
            defaultValue="BTCUSDT,ETHUSDT"
            className="p-2 rounded bg-black/40 border border-neutral-800 md:col-span-2"
          />
        ) : (
          <input 
            id="sym" 
            placeholder="Symbol (BTCUSDT)" 
            defaultValue="BTCUSDT"
            className="p-2 rounded bg-black/40 border border-neutral-800"
          />
        )}
        <input 
          id="tf"  
          placeholder="Timeframe" 
          defaultValue={tab === 'single' ? "15m" : "1h"}
          className="p-2 rounded bg-black/40 border border-neutral-800"
        />
        <input 
          id="s"   
          placeholder="Start (YYYY-MM-DD)" 
          defaultValue="2024-01-01"
          className="p-2 rounded bg-black/40 border border-neutral-800"
        />
        <input 
          id="e"   
          placeholder="End (YYYY-MM-DD)" 
          defaultValue={tab === 'single' ? "2024-01-15" : "2024-03-01"}
          className="p-2 rounded bg-black/40 border border-neutral-800"
        />
        <select id="ex" className="p-2 rounded bg-black/40 border border-neutral-800">
          <option value="binance">Binance</option>
          <option value="btcturk">BTCTurk</option>
        </select>
        {tab === 'single' && (
          <label className="text-xs flex items-center gap-2">
            <input id="fu" type="checkbox"/> Futures
          </label>
        )}
      </div>
      
      <button 
        onClick={run} 
        disabled={loading}
        className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50 transition"
      >
        {loading ? "⏳ Çalıştırılıyor..." : "🚀 Backtest Çalıştır"}
      </button>
      
      {/* Results */}
      {j && !j.error && (
        <div className="space-y-4">
          {/* Walk-Forward Metrics */}
          {tab === 'walkforward' && j.result?.summary && (
            <MetricsCards
              train={j.result.summary.train}
              test={j.result.summary.test}
              overfitting={j.result.overfitting}
            />
          )}
          
          {/* Portfolio Correlation */}
          {tab === 'portfolio' && j.result?.correlation?.matrix && (
            <CorrelationHeatmap
              matrix={j.result.correlation.matrix}
              symbols={j.result.symbols || j.symbols}
              threshold={0.7}
            />
          )}
          
          {/* Equity Curve */}
          {j.metrics?.equity && tab === 'single' && (
            <EquityCurveChart
              equity={j.metrics.equity}
            />
          )}
          
          {tab === 'portfolio' && j.result?.combined?.equityCurve && (
            <EquityCurveChart
              equity={j.result.combined.equityCurve as number[]}
            />
          )}
          
          {/* Quick Metrics Cards for Single/Portfolio */}
          {(tab === 'single' && j.metrics) && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="p-3 rounded-lg border border-neutral-800">
                <div className="text-xs opacity-70">PnL</div>
                <div className={`text-lg font-semibold ${j.metrics.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${j.metrics.pnl.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800">
                <div className="text-xs opacity-70">Win Rate</div>
                <div className="text-lg font-semibold">{(j.metrics.winrate*100).toFixed(1)}%</div>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800">
                <div className="text-xs opacity-70">Sharpe</div>
                <div className={`text-lg font-semibold ${j.metrics.sharpe > 1.5 ? 'text-green-400' : j.metrics.sharpe > 1.0 ? 'text-yellow-400' : ''}`}>
                  {j.metrics.sharpe.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800">
                <div className="text-xs opacity-70">Max DD</div>
                <div className="text-lg font-semibold text-red-400">{j.metrics.maxdd.toFixed(2)}%</div>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800">
                <div className="text-xs opacity-70">Trades</div>
                <div className="text-lg font-semibold">{j.metrics.trades}</div>
              </div>
            </div>
          )}
          
          {tab === 'portfolio' && j.result?.combined && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="p-3 rounded-lg border border-green-800/50 bg-green-950/20">
                <div className="text-xs opacity-70">Portfolio Sharpe</div>
                <div className="text-lg font-semibold text-green-400">{j.result.combined.sharpe.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800">
                <div className="text-xs opacity-70">Win Rate</div>
                <div className="text-lg font-semibold">{(j.result.combined.winRate*100).toFixed(1)}%</div>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800">
                <div className="text-xs opacity-70">Portfolio PnL</div>
                <div className={`text-lg font-semibold ${j.result.combined.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${j.result.combined.pnl.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800">
                <div className="text-xs opacity-70">Avg Correlation</div>
                <div className={`text-lg font-semibold ${j.result.correlation.avgCorrelation > 0.7 ? 'text-orange-400' : 'text-green-400'}`}>
                  {j.result.correlation.avgCorrelation.toFixed(3)}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800">
                <div className="text-xs opacity-70">Div. Benefit</div>
                <div className={`text-lg font-semibold ${j.result.correlation.diversificationBenefit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {j.result.correlation.diversificationBenefit > 0 ? '+' : ''}{j.result.correlation.diversificationBenefit.toFixed(3)}
                </div>
              </div>
            </div>
          )}
          
          <details className="text-xs">
            <summary className="cursor-pointer opacity-70 mb-2 p-2 rounded border border-neutral-800 hover:bg-neutral-900">Raw JSON</summary>
            <pre className="overflow-auto p-3 rounded bg-black/40 border border-neutral-800">{JSON.stringify(j,null,2)}</pre>
          </details>
        </div>
      )}
      
      {j?.error && (
        <div className="rounded-xl border border-red-800 bg-red-950/30 p-4">
          <div className="text-red-400 font-semibold">Hata</div>
          <div className="text-sm opacity-70 mt-1">{j.error}</div>
        </div>
      )}
    </div>
  );
}

