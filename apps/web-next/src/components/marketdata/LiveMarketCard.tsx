'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketStore } from '@/stores/marketStore';
import { formatCurrency } from '@/lib/format';
import type { Staleness } from '@/types/market';

function StalenessPill({ st }: { st: Staleness }) {
  const color = st === 'ok' ? 'bg-emerald-600/20 text-emerald-300'
              : st === 'warn' ? 'bg-amber-600/20 text-amber-300'
              : 'bg-red-600/20 text-red-300';
  const label = st === 'ok' ? 'Güncel' : st === 'warn' ? 'Gecikmeli' : 'Eski';

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${color}`}>
      {label}
    </span>
  );
}

export default function LiveMarketCard({ symbol = 'BTCUSDT' }: { symbol?: string }) {
  const ticker = useMarketStore(s => s.tickers[symbol]);
  const staleness = useMarketStore(s => s.staleness(symbol));

  if (!ticker) {
    return (
      <Card className="bg-card/60 animate-pulse">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{symbol}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm opacity-70">Bağlanıyor...</div>
        </CardContent>
      </Card>
    );
  }

  const bid = ticker.bid ?? ticker.price;
  const ask = ticker.ask ?? ticker.price;
  const spread = ask - bid;
  const spreadPct = ticker.price ? (spread / ticker.price) * 100 : 0;

  return (
    <Card className="bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">{symbol}</CardTitle>
        <StalenessPill st={staleness} />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Price */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-400">Fiyat</span>
          <span className="text-xl font-bold tabular whitespace-nowrap">
            {formatCurrency(ticker.price, 'USD')}
          </span>
        </div>

        {/* Bid / Ask */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-neutral-400 text-xs mb-1">Alış</div>
            <div className="text-green-400 tabular whitespace-nowrap">
              {formatCurrency(bid, 'USD')}
            </div>
          </div>
          <div>
            <div className="text-neutral-400 text-xs mb-1">Satış</div>
            <div className="text-red-400 tabular whitespace-nowrap">
              {formatCurrency(ask, 'USD')}
            </div>
          </div>
        </div>

        {/* Spread */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-400">Spread</span>
          <span className="tabular">
            {spreadPct.toFixed(3)}% ({formatCurrency(spread, 'USD')})
          </span>
        </div>

        {/* 24h Change */}
        {ticker.change24h !== undefined && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-400">24s Değişim</span>
            <span className={`tabular font-medium ${
              ticker.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {ticker.change24h >= 0 ? '+' : ''}{(ticker.change24h * 100).toFixed(2)}%
            </span>
          </div>
        )}

        {/* Last Update */}
        <div className="flex justify-between items-center text-xs text-neutral-500 pt-2 border-t border-neutral-800">
          <span>Son Güncelleme</span>
          <span>{new Date(ticker.ts).toLocaleTimeString('tr-TR')}</span>
        </div>
      </CardContent>
    </Card>
  );
}

