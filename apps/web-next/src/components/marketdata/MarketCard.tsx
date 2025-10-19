import React from 'react';
import { Card } from '@/components/ui/card';

interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface Trade {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

interface MarketCardProps {
  exchange: 'BTCTurk' | 'BIST';
  ticker?: TickerData;
  orderBook?: {
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
  };
  trades?: Trade[];
  isLoading?: boolean;
  error?: string;
}

export type { MarketCardProps, TickerData, OrderBookEntry, Trade };

export function MarketCard({ 
  exchange, 
  ticker, 
  orderBook, 
  trades, 
  isLoading = false, 
  error 
}: MarketCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    return new Intl.NumberFormat('tr-TR', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(volume);
  };

  if (error) {
    return (
      <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <h3 className="font-semibold text-red-800 dark:text-red-200">{exchange}</h3>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{exchange}</h3>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {isLoading ? 'Yükleniyor...' : 'Canlı'}
        </div>
      </div>

      {ticker && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Fiyat</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(ticker.price)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">24s Değişim</span>
            <span className={`text-sm font-medium ${
              ticker.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {ticker.change24h >= 0 ? '+' : ''}{ticker.change24h.toFixed(2)}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Hacim</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {formatVolume(ticker.volume24h)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Yüksek</span>
              <p className="text-gray-900 dark:text-white">{formatPrice(ticker.high24h)}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Düşük</span>
              <p className="text-gray-900 dark:text-white">{formatPrice(ticker.low24h)}</p>
            </div>
          </div>
        </div>
      )}

      {orderBook && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Book</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-green-600 dark:text-green-400 font-medium mb-1">Alış</div>
              {orderBook.bids.slice(0, 3).map((bid, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{formatPrice(bid.price)}</span>
                  <span className="text-gray-900 dark:text-white">{bid.amount.toFixed(4)}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-red-600 dark:text-red-400 font-medium mb-1">Satış</div>
              {orderBook.asks.slice(0, 3).map((ask, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{formatPrice(ask.price)}</span>
                  <span className="text-gray-900 dark:text-white">{ask.amount.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {trades && trades.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Son İşlemler</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {trades.slice(0, 5).map((trade) => (
              <div key={trade.id} className="flex justify-between items-center text-xs">
                <span className={`font-medium ${
                  trade.side === 'buy' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {trade.side === 'buy' ? '↑' : '↓'} {formatPrice(trade.price)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">{trade.amount.toFixed(4)}</span>
                <span className="text-gray-500 dark:text-gray-500">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default MarketCard;
