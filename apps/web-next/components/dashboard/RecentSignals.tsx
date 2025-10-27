'use client';

import { useRouter } from "next/navigation";

type Signal = {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'hold';
  strength: 'weak' | 'medium' | 'strong';
  source: 'rsi' | 'macd' | 'ema' | 'bollinger' | 'ai';
  price: number;
  timestamp: string;
  description: string;
};

export default function RecentSignals() {
  const router = useRouter();
  
  // Mock data - replace with real API call
  const signals: Signal[] = [
    {
      id: '1',
      symbol: 'BTCUSDT',
      type: 'buy',
      strength: 'strong',
      source: 'rsi',
      price: 43250,
      timestamp: '2024-01-15T10:45:00Z',
      description: 'RSI oversold seviyesinde, güçlü alış sinyali',
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      type: 'sell',
      strength: 'medium',
      source: 'macd',
      price: 2680,
      timestamp: '2024-01-15T10:30:00Z',
      description: 'MACD bearish crossover tespit edildi',
    },
    {
      id: '3',
      symbol: 'ADAUSDT',
      type: 'hold',
      strength: 'weak',
      source: 'ema',
      price: 0.46,
      timestamp: '2024-01-15T10:15:00Z',
      description: 'EMA trend çizgisi üzerinde konsolidasyon',
    },
    {
      id: '4',
      symbol: 'SOLUSDT',
      type: 'buy',
      strength: 'strong',
      source: 'ai',
      price: 98.50,
      timestamp: '2024-01-15T10:00:00Z',
      description: 'AI modeli pozitif momentum öngörüyor',
    },
  ];

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'buy': return '📈';
      case 'sell': return '📉';
      case 'hold': return '➡️';
      default: return '❓';
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'buy': return 'text-green-400';
      case 'sell': return 'text-red-400';
      case 'hold': return 'text-yellow-400';
      default: return 'text-zinc-400';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'weak': return 'bg-green-500';
      default: return 'bg-zinc-500';
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'rsi': return 'RSI';
      case 'macd': return 'MACD';
      case 'ema': return 'EMA';
      case 'bollinger': return 'Bollinger';
      case 'ai': return 'AI';
      default: return source.toUpperCase();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (signals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-zinc-400 text-sm">Sinyal yok</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {signals.slice(0, 5).map((signal) => (
        <div
          key={signal.id}
          className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => router.push('/signals')}
        >
          <div className="text-xl">{getSignalIcon(signal.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-sm">{signal.symbol}</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getSignalColor(signal.type)}`}>
                  {signal.type.toUpperCase()}
                </span>
                <div className={`w-2 h-2 rounded-full ${getStrengthColor(signal.strength)}`} />
              </div>
            </div>
            
            <div className="text-xs text-zinc-300 mb-1">
              {signal.description}
            </div>
            
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="bg-zinc-700 px-2 py-1 rounded">
                  {getSourceText(signal.source)}
                </span>
                <span>{formatCurrency(signal.price)}</span>
              </div>
              <span>{formatTime(signal.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
      
      {signals.length > 5 && (
        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/signals')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            +{signals.length - 5} sinyal daha görüntüle
          </button>
        </div>
      )}
    </div>
  );
} 