'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';

export default function StrategyBotPage() {
  const [out, setOut] = useState<any>(null);
  const [duration, setDuration] = useState<number | null>(null);

  async function call(body: any) {
    try {
      const t0 = performance.now();
      const res = await fetch('/api/copilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const ms = Math.round(performance.now() - t0);
      setDuration(ms);
      setOut(data);
    } catch (error: any) {
      setOut({ error: error.message || 'Request failed' });
      setDuration(null);
    }
  }

  function downloadArtifact(path: string) {
    const filename = path.split('/').pop() || 'artifact.txt';
    window.open(`/api/backtest/artifacts${path}`, '_blank');
  }

  const examples = [
    {
      label: '/strat new rsi tf:15m sym:BTCUSDT',
      json: {
        action: 'advisor/suggest',
        params: {
          topic: 'new_strategy',
          spec: { family: 'rsi', tf: '15m', symbol: 'BTCUSDT' },
        },
        dryRun: true,
        confirm_required: false,
        reason: 'draft strategy',
      },
    },
    {
      label: '/strat backtest id:demo-rsi seed:42',
      json: {
        action: 'canary/run',
        params: {
          symbol: 'BTCUSDT',
          tf: '15m',
          strategy: 'rsi',
          args: { period: 14, upper: 70, lower: 30 },
          seed: 42,
        },
        dryRun: true,
        confirm_required: false,
        reason: 'backtest dry',
      },
    },
    {
      label: '/strat optimize id:demo-rsi space:grid',
      json: {
        action: 'advisor/suggest',
        params: { topic: 'optimize', id: 'demo-rsi', space: 'grid' },
        dryRun: true,
        confirm_required: false,
        reason: 'param search proposal',
      },
    },
  ];

  const artifacts = out?.data?.artifacts;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Strategy Bot (MVP)</h1>
      <p className="text-gray-600">
        Doğal dilden strateji taslakları, backtest dry-run ve optimizasyon önerileri.
      </p>

      <div className="grid md:grid-cols-3 gap-3">
        {examples.map((e, i) => (
          <button
            key={i}
            onClick={() => call(e.json)}
            className="px-3 py-2 rounded border hover:bg-gray-50 text-left text-sm"
          >
            {e.label}
          </button>
        ))}
      </div>

      {duration !== null && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-mono">⏱️ {duration}ms</span>
          {out?.cid && <span className="font-mono text-xs">• cid: {out.cid}</span>}
        </div>
      )}

      {artifacts && (
        <div className="flex gap-2">
          {artifacts.equity && (
            <button
              onClick={() => downloadArtifact(artifacts.equity)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              <Download className="w-4 h-4" />
              Download Equity
            </button>
          )}
          {artifacts.trades && (
            <button
              onClick={() => downloadArtifact(artifacts.trades)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              <Download className="w-4 h-4" />
              Download Trades
            </button>
          )}
        </div>
      )}

      <pre className="p-3 bg-gray-900 text-gray-100 rounded overflow-auto text-sm max-h-96">
        {out ? JSON.stringify(out, null, 2) : 'Çıktı burada görünecek.'}
      </pre>
    </div>
  );
}

