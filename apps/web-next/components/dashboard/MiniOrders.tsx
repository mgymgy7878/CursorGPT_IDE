'use client';

import { useRouter } from "next/navigation";

type Order = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop';
  size: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: string;
};

export default function MiniOrders() {
  const router = useRouter();
  
  // Mock data - replace with real API call
  const orders: Order[] = [
    {
      id: '1',
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'limit',
      size: 0.05,
      price: 43000,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      side: 'sell',
      type: 'stop',
      size: 1.0,
      price: 2700,
      status: 'pending',
      createdAt: '2024-01-15T09:15:00Z',
    },
    {
      id: '3',
      symbol: 'ADAUSDT',
      side: 'buy',
      type: 'market',
      size: 500,
      price: 0.46,
      status: 'filled',
      createdAt: '2024-01-15T08:45:00Z',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'filled': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'filled': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-zinc-400 text-sm">Açık emir yok</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.slice(0, 5).map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => router.push('/orders')}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              order.side === 'buy' ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <div>
              <div className="font-medium text-sm">{order.symbol}</div>
              <div className="text-xs text-zinc-400">
                {order.size} {order.side === 'buy' ? 'Alış' : 'Satış'} • {order.type}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">
              {formatCurrency(order.price)}
            </div>
            <div className={`text-xs ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </div>
          </div>
        </div>
      ))}
      
      {orders.length > 5 && (
        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/orders')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            +{orders.length - 5} emir daha görüntüle
          </button>
        </div>
      )}
    </div>
  );
} 