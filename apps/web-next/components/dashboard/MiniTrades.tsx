'use client';

import { useRouter } from "next/navigation";

type Trade = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  pnl: number;
  timestamp: string;
};

export default function MiniTrades() {
  const router = useRouter();
  
  // Mock data - replace with real API call
  const trades: Trade[] = [
    {
      id: '1',
      symbol: 'BTCUSDT',
      side: 'sell',
      size: 0.02,
      price: 43250,
      pnl: 125.50,
      timestamp: '2024-01-15T10:45:00Z',
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      side: 'buy',
      size: 0.5,
      price: 2680,
      pnl: -45.20,
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      id: '3',
      symbol: 'ADAUSDT',
      side: 'sell',
      size: 1000,
      price: 0.48,
      pnl: 20.00,
      timestamp: '2024-01-15T10:15:00Z',
    },
    {
      id: '4',
      symbol: 'SOLUSDT',
      side: 'buy',
      size: 5,
      price: 98.50,
      pnl: 75.25,
      timestamp: '2024-01-15T10:00:00Z',
    },
  ];

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

  if (trades.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-zinc-400 text-sm">İşlem geçmişi yok</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trades.slice(0, 5).map((trade) => (
        <div
          key={trade.id}
          className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => router.push('/trades')}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              trade.side === 'buy' ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <div>
              <div className="font-medium text-sm">{trade.symbol}</div>
              <div className="text-xs text-zinc-400">
                {trade.size} {trade.side === 'buy' ? 'Alış' : 'Satış'} • {formatTime(trade.timestamp)}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">
              {formatCurrency(trade.price)}
            </div>
            <div className={`text-xs font-medium ${
              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
            </div>
          </div>
        </div>
      ))}
      
      {trades.length > 5 && (
        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/trades')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            +{trades.length - 5} işlem daha görüntüle
          </button>
        </div>
      )}
    </div>
  );
} 