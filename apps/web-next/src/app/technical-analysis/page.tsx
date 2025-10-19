"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';
const RechartsLine = dynamic(() => import('@/components/charts/RechartsLine'), { ssr: false, loading: () => <div>Loading chart…</div> });
const LightweightMini = dynamic(() => import('@/components/charts/LightweightMini'), { ssr: false, loading: () => <div>Loading chart…</div> });
const MACDPanel = dynamic(() => import('@/components/technical/MACDPanelStub'), { ssr: false });
const StochPanel = dynamic(() => import('@/components/technical/StochPanelStub'), { ssr: false });
const PriceChartLC = dynamic(() => import('@/components/technical/PriceChartLCStub'), { ssr: false });

export default function TechnicalAnalysisPage() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [tf, setTf] = useState<"15m"|"1h"|"4h"|"1d">("1h");
  const [loading, setLoading] = useState(false);
  const [showFib, setShowFib] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [candles, setCandles] = useState<any[]>([]);
  const [fib, setFib] = useState<any>(null);
  const [bb, setBb] = useState<any>(null);
  const [macd, setMacd] = useState<any>(null);
  const [stoch, setStoch] = useState<any>(null);

  async function loadAll() {
    setLoading(true);
    try {
      // Fetch candles
      const candlesRes = await fetch(`/api/marketdata/candles?symbol=${symbol}&timeframe=${tf}&limit=300&ts=${Date.now()}`);
      const cd = await candlesRes.json();

      // Fetch Fibonacci levels if enabled
      const fibRes = showFib ? await fetch('/api/copilot/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          action: 'tools/fibonacci_levels', 
          params: { symbol, timeframe: tf, period: 300 } 
        })
      }).then(r => r.json()) : null;

      // Fetch Bollinger Bands if enabled
      const bbRes = showBB ? await fetch('/api/copilot/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          action: 'tools/bollinger_bands', 
          params: { symbol, timeframe: tf, period: 20, stdDev: 2 } 
        })
      }).then(r => r.json()) : null;

      // Fetch MACD
      const macdRes = await fetch('/api/copilot/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          action: 'tools/macd', 
          params: { symbol, timeframe: tf } 
        })
      }).then(r => r.json());

      // Fetch Stochastic
      const stochRes = await fetch('/api/copilot/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          action: 'tools/stochastic', 
          params: { symbol, timeframe: tf } 
        })
      }).then(r => r.json());

      setCandles(cd);
      setFib(fibRes);
      setBb(bbRes);
      setMacd(macdRes);
      setStoch(stochRes);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const bbSeries = bb?.series?.length ? bb.series.slice(-candles.length) : undefined;
  const fibLevels = fib?.levels;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold mb-2">📈 Teknik Analiz</h1>
        <p className="text-sm opacity-70">Fibonacci ve Bollinger Bands araçları</p>
      </div>

      {/* Controls */}
      <div className="flex gap-2 items-center">
        <input 
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol"
          className="px-3 py-2 rounded bg-black/40 border border-neutral-800"
        />
        <select 
          value={tf}
          onChange={e => setTf(e.target.value as any)}
          className="px-3 py-2 rounded bg-black/40 border border-neutral-800"
        >
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
        </select>
        
        <label className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={showFib} 
            onChange={e => setShowFib(e.target.checked)}
          />
          <span>Fibonacci</span>
        </label>
        
        <label className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={showBB} 
            onChange={e => setShowBB(e.target.checked)}
          />
          <span>Bollinger Bands</span>
        </label>
        
        <button 
          onClick={loadAll} 
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50 transition"
        >
          {loading ? '⏳ Yükleniyor...' : '📊 Yükle'}
        </button>
      </div>

      {/* Quick Alert Templates */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs opacity-70">Hızlı Alert:</span>
        <QuickTemplate
          label="BB Break"
          payload={(symbol: string, tf: string) => ({
            symbol,
            timeframe: tf,
            type: "bb_break",
            params: { side: "both", period: 20, stdDev: 2 }
          })}
          symbol={symbol}
          tf={tf}
        />
        <QuickTemplate
          label="Fib Touch (±0.2%)"
          payload={(symbol: string, tf: string) => ({
            symbol,
            timeframe: tf,
            type: "fib_touch",
            params: { tolerance: 0.002, lookback: 200 }
          })}
          symbol={symbol}
          tf={tf}
        />
        <QuickTemplate
          label="MACD Bullish"
          payload={(symbol: string, tf: string) => ({
            symbol,
            timeframe: tf,
            type: "macd_cross",
            params: { mode: "signal", side: "bullish" }
          })}
          symbol={symbol}
          tf={tf}
        />
        <QuickTemplate
          label="Stoch Oversold"
          payload={(symbol: string, tf: string) => ({
            symbol,
            timeframe: tf,
            type: "stoch_cross",
            params: { side: "oversold", kPeriod: 14, dPeriod: 3 }
          })}
          symbol={symbol}
          tf={tf}
        />
        <a
          href="/alerts"
          className="ml-auto px-3 py-2 text-xs rounded-lg border border-neutral-700 hover:bg-neutral-800"
        >
          🔎 Tüm Alerts
        </a>
      </div>

      {/* Results */}
      <div className="border border-neutral-800 rounded-xl p-4 min-h-[400px] bg-black/20">
        <div className="text-sm opacity-70 mb-4">
          {candles?.length > 0 ? `${candles.length} mum yüklendi` : 'Veri bekleniyor...'}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Fibonacci Levels */}
          {fib?.levels && (
            <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
              <div className="font-semibold mb-3 flex items-center gap-2">
                <span>📐</span>
                <span>Fibonacci Retracement</span>
              </div>
              <div className="text-xs space-y-1 mb-3">
                <div className="flex justify-between opacity-70">
                  <span>Yüksek:</span>
                  <span className="font-mono">${fib.high?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between opacity-70">
                  <span>Düşük:</span>
                  <span className="font-mono">${fib.low?.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-xs space-y-1">
                {fib.levels.map((l: any) => (
                  <div 
                    key={l.ratio} 
                    className="flex justify-between p-1 rounded hover:bg-neutral-800/50"
                  >
                    <span className={l.ratio === 0.618 ? 'text-yellow-400 font-semibold' : ''}>
                      {(l.ratio * 100).toFixed(1)}%
                    </span>
                    <span className="font-mono">${l.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bollinger Bands */}
          {bb?.current && (
            <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
              <div className="font-semibold mb-3 flex items-center gap-2">
                <span>📊</span>
                <span>Bollinger Bands</span>
              </div>
              <div className="text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Üst Band:</span>
                  <span className="font-mono text-green-400">${bb.current.u}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Orta (SMA):</span>
                  <span className="font-mono text-blue-400">${bb.current.m}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Alt Band:</span>
                  <span className="font-mono text-red-400">${bb.current.l}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-800 text-xs opacity-70">
                  <div>Period: {bb.period}</div>
                  <div>Std Dev: {bb.stdDev}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart with Overlays */}
        <div className="mt-4">
          <PriceChartLC />
        </div>

        {/* Technical Overview (stubbed while build hotfix) */}
        <div className="mt-6">
          <RechartsLine data={Array.from({length:32},(_,i)=>({t:i,v:100+Math.sin(i/3)*5}))} />
        </div>
        <div className="mt-6">
          <LightweightMini points={Array.from({length:32},(_,i)=>({time:i,value:100+Math.cos(i/4)*3}))} />
        </div>

        {/* Momentum Indicators */}
        {macd && (
          <MACDPanel 
            macd={macd.macd} 
            signal={macd.signal} 
            hist={macd.histogram} 
          />
        )}
        
        {stoch && (
          <StochPanel 
            k={stoch.k} 
            d={stoch.d} 
          />
        )}

        {/* Quick Alert Creation */}
        <div className="mt-4 border border-neutral-800 rounded-xl p-3 bg-neutral-950/30">
          <div className="text-sm font-medium mb-2">🔔 Hızlı Uyarı Oluştur</div>
          <div className="flex flex-wrap gap-2">
            <select id="atype" className="p-2 bg-black/40 border border-neutral-800 rounded text-sm">
              <option value="bb_break">BB Break</option>
              <option value="fib_touch">Fib Touch</option>
              <option value="macd_cross">MACD Cross</option>
              <option value="stoch_cross">Stoch Cross</option>
            </select>
            <button
              onClick={async () => {
                const type = (document.getElementById('atype') as HTMLSelectElement)?.value;
                
                try {
                  const res = await fetch('/api/copilot/action', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                      action: 'alerts/create',
                      params: { symbol, timeframe: tf, type, params: { side: 'both' } }
                    })
                  }).then(r => r.json());
                  
                  alert(res?.ok ? `Alert oluşturuldu: ${res.id.slice(0, 8)}...` : 'Hata oluştu');
                } catch (err) {
                  alert('Alert oluşturulamadı');
                }
              }}
              className="px-3 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 transition text-sm"
            >
              Oluştur
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/copilot/action', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                      action: 'notify/test',
                      params: {}
                    })
                  }).then(r => r.json());
                  
                  alert(res?.ok ? '🔔 Test bildirimi gönderildi' : 'Bildirim hatası');
                } catch (err) {
                  alert('Bildirim gönderilemedi');
                }
              }}
              className="px-3 py-2 rounded-xl border border-amber-700/50 hover:bg-amber-900/20 transition text-sm"
            >
              🔔 Test Bildirim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickTemplate({
  label,
  payload,
  symbol,
  tf
}: {
  label: string;
  payload: (symbol: string, tf: string) => any;
  symbol: string;
  tf: string;
}) {
  return (
    <button
      onClick={async () => {
        const body = JSON.stringify(payload(symbol, tf));
        
        try {
          const r = await fetch("/api/alerts/create", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body
          });
          const j = await r.json();
          alert(j?.ok ? `✅ Alert oluşturuldu: ${j.id.slice(0, 8)}...` : `❌ Hata oluştu`);
        } catch (err) {
          alert("❌ Alert oluşturulamadı");
        }
      }}
      className="px-3 py-2 text-xs rounded-lg border border-neutral-700 hover:bg-neutral-800"
    >
      {label}
    </button>
  );
}

