'use client';

import { Card, Text, Metric, Badge } from '@tremor/react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { useWebSocket } from '@/lib/useWebSocket';
import { useEffect, useState } from 'react';

interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface MarketWatchProps {
  symbols?: string[];
}

export function MarketWatch({ symbols = ['BTCUSDT'] }: MarketWatchProps) {
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});

  // Initial data fetch
  const { data: initialData, error } = useApi<TickerData[]>(
    `/api/public/tickers?symbols=${symbols.join(',')}`
  );

  // WebSocket for live updates
  const { connected, message } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001/ws',
    { topics: ['marketData'] }
  );

  // Initialize tickers from API
  useEffect(() => {
    if (initialData) {
      const tickerMap: Record<string, TickerData> = {};
      initialData.forEach(ticker => {
        tickerMap[ticker.symbol] = ticker;
      });
      setTickers(tickerMap);
    }
  }, [initialData]);

  // Update tickers from WebSocket
  useEffect(() => {
    if (message?.topic === 'marketData' && message.payload) {
      const { symbol, ...data } = message.payload;
      if (symbol && symbols.includes(symbol)) {
        setTickers(prev => ({
          ...prev,
          [symbol]: { ...prev[symbol], ...data, symbol }
        }));
      }
    }
  }, [message, symbols]);

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <Text className="text-gray-600">Piyasa verisi yüklenemedi</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Backend servisine bağlanılamadı
          </Text>
        </div>
      </Card>
    );
  }

  if (!initialData && !Object.keys(tickers).length) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          {symbols.map(s => (
            <div key={s} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {symbols.map(symbol => {
        const ticker = tickers[symbol];
        if (!ticker) return null;

        const isPositive = ticker.change24hPercent >= 0;
        const changeColor = isPositive ? 'text-green-600' : 'text-red-600';

        return (
          <Card key={symbol} decoration="left" decorationColor={isPositive ? 'green' : 'red'}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Text className="font-semibold text-gray-900 dark:text-gray-100">
                    {symbol}
                  </Text>
                  {connected && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Canlı" />
                  )}
                </div>
                
                <Metric className="text-2xl mb-2">
                  ${ticker.price.toFixed(2)}
                </Metric>

                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className={`h-4 w-4 ${changeColor}`} />
                  ) : (
                    <TrendingDown className={`h-4 w-4 ${changeColor}`} />
                  )}
                  <Text className={changeColor}>
                    {isPositive ? '+' : ''}
                    {ticker.change24hPercent.toFixed(2)}%
                  </Text>
                  <Text className="text-gray-500">
                    ({isPositive ? '+' : ''}{ticker.change24h.toFixed(2)})
                  </Text>
                </div>
              </div>

              <div className="text-right">
                <Text className="text-xs text-gray-500">24s Hacim</Text>
                <Text className="font-medium">
                  ${(ticker.volume24h / 1000000).toFixed(1)}M
                </Text>
                <div className="mt-2 space-y-1">
                  <div className="flex gap-2 text-xs">
                    <Text className="text-gray-500">H:</Text>
                    <Text className="text-green-600">${ticker.high24h.toFixed(2)}</Text>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Text className="text-gray-500">L:</Text>
                    <Text className="text-red-600">${ticker.low24h.toFixed(2)}</Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

