"use client";
// apps/web-next/src/app/correlation/page.tsx
import { useEffect, useState } from 'react';

interface CorrEdge {
  leader: string;
  follower: string;
  rho: number;
  beta: number;
  lag: number;
  n: number;
  pValue: number;
}

interface Signal {
  action: string;
  direction?: string;
  confidence: number;
  reason: string;
}

export default function CorrelationPage() {
  const [universe, setUniverse] = useState('BIST_CORE');
  const [edges, setEdges] = useState<CorrEdge[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('GARAN');
  const [leaders, setLeaders] = useState<CorrEdge[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [engineRunning, setEngineRunning] = useState(false);

  // Start correlation engine
  async function startEngine() {
    try {
      const res = await fetch('/api/correlation/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ universe, windowSec: 900, lagMax: 3 }),
      });
      const data = await res.json();
      if (data.ok) {
        setEngineRunning(true);
        alert('Korelasyon motoru başlatıldı!');
      }
    } catch (err) {
      console.error(err);
      alert('Motor başlatılamadı');
    }
  }

  // Fetch correlation matrix
  async function fetchMatrix() {
    try {
      const res = await fetch(`/api/correlation/matrix?universe=${universe}`);
      const data = await res.json();
      if (data.ok) {
        setEdges(data.edges);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch leaders for selected symbol
  async function fetchLeaders() {
    if (!selectedSymbol) return;
    try {
      const res = await fetch(`/api/correlation/leaders?symbol=${selectedSymbol}&universe=${universe}`);
      const data = await res.json();
      if (data.ok) {
        setLeaders(data.leaders);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Generate signal
  async function generateSignal(follower: string, leader: string, rule: string) {
    try {
      const res = await fetch('/api/correlation/signal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          follower,
          leader,
          rule,
          params: { corrMin: 0.6, betaMin: 0.7, zScoreMax: 1.5 },
          moneyFlow: { nmf: 0, obi: 0, cvd: 0 }, // Mock
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSignals(prev => [...prev, { ...data, timestamp: new Date().toISOString() }]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Korelasyon & Lider-Takipçi Analiz</h1>
        <div className="flex gap-2">
          <select
            value={universe}
            onChange={(e) => setUniverse(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/40 border border-neutral-800"
          >
            <option value="BIST_CORE">BIST Core</option>
            <option value="CRYPTO_CORE">Kripto Core</option>
            <option value="BIST_GLOBAL_FUSION">BIST + Global</option>
          </select>
          <button
            onClick={startEngine}
            disabled={engineRunning}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {engineRunning ? 'Motor Çalışıyor' : 'Motor Başlat'}
          </button>
          <button
            onClick={fetchMatrix}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
          >
            Matrix Güncelle
          </button>
        </div>
      </div>

      {/* Correlation Matrix Heatmap (Table) */}
      <div className="rounded-2xl border border-neutral-800 p-4">
        <h2 className="text-xl mb-3">Korelasyon Matrisi</h2>
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="p-2 text-left">Lider</th>
                <th className="p-2 text-left">Takipçi</th>
                <th className="p-2 text-right">ρ</th>
                <th className="p-2 text-right">β</th>
                <th className="p-2 text-right">Lag</th>
                <th className="p-2 text-right">n</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {edges.slice(0, 30).map((edge, i) => (
                <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                  <td className="p-2">{edge.leader}</td>
                  <td className="p-2">{edge.follower}</td>
                  <td className="p-2 text-right">
                    <span
                      className={`px-2 py-1 rounded ${
                        Math.abs(edge.rho) >= 0.7
                          ? 'bg-green-900/30 text-green-400'
                          : Math.abs(edge.rho) >= 0.5
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      {edge.rho.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-2 text-right">{edge.beta.toFixed(2)}</td>
                  <td className="p-2 text-right">{edge.lag}</td>
                  <td className="p-2 text-right text-neutral-500">{edge.n}</td>
                  <td className="p-2">
                    <button
                      onClick={() => generateSignal(edge.follower, edge.leader, 'FOLLOWER_CONTINUATION')}
                      className="text-xs px-2 py-1 rounded bg-blue-900/30 hover:bg-blue-900/50"
                    >
                      Sinyal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaders for Symbol */}
      <div className="rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl">Liderler</h2>
          <input
            type="text"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            placeholder="Sembol (örn: GARAN)"
            className="px-3 py-1 rounded bg-black/40 border border-neutral-800"
          />
          <button
            onClick={fetchLeaders}
            className="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
          >
            Sorgula
          </button>
        </div>
        <div className="space-y-2">
          {leaders.map((leader, i) => (
            <div key={i} className="p-3 rounded-lg bg-neutral-900/50 flex justify-between items-center">
              <div>
                <div className="font-mono">{leader.leader}</div>
                <div className="text-xs text-neutral-500">
                  ρ={leader.rho.toFixed(2)} | β={leader.beta.toFixed(2)} | lag={leader.lag}
                </div>
              </div>
              <button
                onClick={() => generateSignal(selectedSymbol, leader.leader, 'LEAD_CONFIRM')}
                className="text-xs px-3 py-1 rounded bg-green-900/30 hover:bg-green-900/50"
              >
                Teyit Sinyali
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Signals */}
      <div className="rounded-2xl border border-neutral-800 p-4">
        <h2 className="text-xl mb-3">Canlı Sinyaller</h2>
        <div className="space-y-2 max-h-64 overflow-auto">
          {signals.slice().reverse().map((sig, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                sig.signal.action === 'open'
                  ? 'bg-green-900/20 border-l-4 border-green-500'
                  : sig.signal.action === 'close'
                  ? 'bg-red-900/20 border-l-4 border-red-500'
                  : 'bg-neutral-900/50'
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-mono text-sm">
                    {sig.edge.follower} ← {sig.edge.leader}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {sig.signal.reason}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold uppercase">{sig.signal.action}</div>
                  <div className="text-xs text-neutral-500">
                    conf: {(sig.signal.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

