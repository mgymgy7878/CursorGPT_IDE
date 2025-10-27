'use client';

import { Card, Title, Text, Badge } from '@tremor/react';
import { Bot, Code, TrendingUp, CheckCircle, Play, Zap } from 'lucide-react';
import { useState } from 'react';

interface StrategyDraft {
  name: string;
  pair: string;
  timeframe: string;
  indicators: string[];
  conditions: string[];
  params: Record<string, any>;
}

interface BacktestResult {
  ok: boolean;
  stub?: boolean;
  metrics?: any;
  summary?: any;
}

interface OptimizeResult {
  ok: boolean;
  stub?: boolean;
  best?: Array<{ params: Record<string, any>; score: number }>;
}

export default function StrategyLabCopilotPage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('15m');
  const [objective, setObjective] = useState('trend');
  const [risk, setRisk] = useState('moderate');
  const [code, setCode] = useState('// strategy code will appear here');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe, objective, risk }),
      });

      const data = await response.json();
      if (data.ok) {
        setCode(data.code);
      }
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBacktest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/strategy/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          symbol,
          timeframe,
          start: '2024-01-01',
          end: '2024-12-31',
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Backtest error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/strategy/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          symbol,
          timeframe,
          grid: {
            emaFast: [12, 16, 18, 20],
            emaSlow: [50, 52, 55],
            rsi: [12, 14, 16],
          },
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Optimize error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title>Strateji Lab Copilotu</Title>
          <Text className="mt-1">AI ile strateji oluştur, test et, optimize et</Text>
        </div>
        <Bot className="w-10 h-10 text-purple-500" />
      </div>

      {/* Input Form */}
      <Card>
        <Title>Parametreler</Title>
        <div className="grid md:grid-cols-4 gap-3 mt-4">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Symbol (e.g. BTCUSDT or THYAO)"
            className="px-3 py-2 rounded-lg bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            placeholder="Timeframe (e.g. 15m)"
            className="px-3 py-2 rounded-lg bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="trend">Trend Following</option>
            <option value="mean-reversion">Mean Reversion</option>
            <option value="momentum">Momentum</option>
          </select>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            <Code className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={handleBacktest}
            disabled={loading || !code}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Backtest
          </button>
          <button
            onClick={handleOptimize}
            disabled={loading || !code}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Optimize
          </button>
        </div>
      </Card>

      {/* Strategy Code */}
      <Card>
        <Title>Strategy Code</Title>
        <pre className="mt-4 text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono">
          {code}
        </pre>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <Title>
            {result.stub && '(Stub) '}
            {result.metrics ? 'Backtest Sonuçları' : 'Optimization Sonuçları'}
          </Title>
          <pre className="mt-4 text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
          {result.stub && (
            <Text className="mt-2 text-sm text-yellow-600">
              ⚠️ Bu stub verilerdir. Gerçek backtest engine entegrasyonu bekleniyor.
            </Text>
          )}
        </Card>
      )}
    </div>
  );
}

