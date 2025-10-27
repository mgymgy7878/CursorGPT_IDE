"use client";
import { useEffect, useState } from 'react';

interface Signal {
  id: string;
  timestamp: number;
  symbol: string;
  source: string;
  direction: string;
  strength: number;
  horizon: string;
  reason: string;
  guardrails?: {
    staleness_ok: boolean;
    licensing_ok: boolean;
    regime_stable: boolean;
  };
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [source, setSource] = useState<string>('');
  const [summary, setSummary] = useState<any>(null);

  async function loadSignals() {
    try {
      const url = source ? `/api/signals/feed?source=${source}` : '/api/signals/feed';
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setSignals(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadSummary() {
    try {
      const res = await fetch('/api/signals/summary');
      const data = await res.json();
      if (data.ok) {
        setSummary(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadSignals();
    loadSummary();
    const interval = setInterval(() => {
      loadSignals();
      loadSummary();
    }, 3000);
    return () => clearInterval(interval);
  }, [source]);

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'long':
        return 'bg-green-900/30 border-l-4 border-green-500';
      case 'short':
        return 'bg-red-900/30 border-l-4 border-red-500';
      case 'flat':
      case 'neutral':
        return 'bg-neutral-900/30 border-l-4 border-neutral-500';
      default:
        return 'bg-neutral-900/30';
    }
  };

  const getSourceBadge = (src: string) => {
    const colors: Record<string, string> = {
      correlation: 'bg-blue-900/50 text-blue-300',
      news: 'bg-purple-900/50 text-purple-300',
      macro: 'bg-yellow-900/50 text-yellow-300',
      crypto_micro: 'bg-cyan-900/50 text-cyan-300',
      bist_breadth: 'bg-pink-900/50 text-pink-300',
    };
    return colors[src] || 'bg-neutral-800 text-neutral-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">📡 Sinyal Merkezi</h1>
        <p className="text-neutral-400">
          Tüm kaynaklardan gelen sinyaller tek akışta birleşiyor
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-neutral-800 p-4">
            <div className="text-xs opacity-70 mb-1">Toplam Sinyal</div>
            <div className="text-3xl font-bold">{summary.total}</div>
          </div>
          <div className="rounded-2xl border border-neutral-800 p-4">
            <div className="text-xs opacity-70 mb-1">Kaynak Sayısı</div>
            <div className="text-3xl font-bold">
              {Object.keys(summary.bySource || {}).length}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 p-4">
            <div className="text-xs opacity-70 mb-1">Long Sinyalleri</div>
            <div className="text-3xl font-bold text-green-400">
              {summary.byDirection?.long || 0}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 p-4">
            <div className="text-xs opacity-70 mb-1">Short Sinyalleri</div>
            <div className="text-3xl font-bold text-red-400">
              {summary.byDirection?.short || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSource('')}
          className={`px-4 py-2 rounded-xl border transition-colors ${
            source === ''
              ? 'bg-blue-900/30 border-blue-700'
              : 'border-neutral-800 hover:bg-neutral-900'
          }`}
        >
          Tümü
        </button>
        {['correlation', 'news', 'macro', 'crypto_micro', 'bist_breadth'].map((src) => (
          <button
            key={src}
            onClick={() => setSource(src)}
            className={`px-4 py-2 rounded-xl border transition-colors ${
              source === src
                ? 'bg-blue-900/30 border-blue-700'
                : 'border-neutral-800 hover:bg-neutral-900'
            }`}
          >
            {src.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Signals Feed */}
      <div className="space-y-3">
        {signals.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            Henüz sinyal yok. Analiz motorları çalışmaya başladığında burada görünecek.
          </div>
        )}
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`rounded-2xl border p-4 ${getDirectionColor(signal.direction)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-lg font-bold">{signal.symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded-lg ${getSourceBadge(signal.source)}`}>
                    {signal.source}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-lg ${
                      signal.direction === 'long'
                        ? 'bg-green-900/50 text-green-300'
                        : signal.direction === 'short'
                        ? 'bg-red-900/50 text-red-300'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {signal.direction.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-neutral-400">
                  {new Date(signal.timestamp).toLocaleString('tr-TR')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-70">Güç</div>
                <div className="text-2xl font-bold">{Math.round(signal.strength * 100)}%</div>
              </div>
            </div>

            <div className="text-sm mb-2">{signal.reason}</div>

            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <div>Ufuk: {signal.horizon}</div>
              {signal.guardrails && (
                <>
                  {!signal.guardrails.staleness_ok && (
                    <span className="text-yellow-400">⚠️ Eski veri</span>
                  )}
                  {!signal.guardrails.regime_stable && (
                    <span className="text-orange-400">⚠️ Rejim değişikliği</span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

