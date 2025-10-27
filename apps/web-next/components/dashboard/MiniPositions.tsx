'use client';

import { useRouter } from "next/navigation";

type Position = {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
};

export default function MiniPositions() {
  const router = useRouter();
  
  // Mock data - replace with real API call
  const positions: Position[] = [
    {
      id: '1',
      symbol: 'BTCUSDT',
      side: 'long',
      size: 0.1,
      entryPrice: 43250,
      currentPrice: 43500,
      pnl: 25,
      pnlPercent: 0.58,
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      side: 'short',
      size: 1.5,
      entryPrice: 2680,
      currentPrice: 2650,
      pnl: 45,
      pnlPercent: 1.12,
    },
    {
      id: '3',
      symbol: 'ADAUSDT',
      side: 'long',
      size: 1000,
      entryPrice: 0.45,
      currentPrice: 0.44,
      pnl: -10,
      pnlPercent: -2.22,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  if (positions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-zinc-400 text-sm">Açık pozisyon yok</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {positions.slice(0, 5).map((position) => (
        <div
          key={position.id}
          className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => router.push('/positions')}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              position.side === 'long' ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <div>
              <div className="font-medium text-sm">{position.symbol}</div>
              <div className="text-xs text-zinc-400">
                {position.size} {position.side === 'long' ? 'Long' : 'Short'}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-sm font-medium ${
              position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(position.pnl)}
            </div>
            <div className={`text-xs ${
              position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatPercent(position.pnlPercent)}
            </div>
          </div>
        </div>
      ))}
      
      {positions.length > 5 && (
        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/positions')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            +{positions.length - 5} pozisyon daha görüntüle
          </button>
        </div>
      )}
    </div>
  );
} 