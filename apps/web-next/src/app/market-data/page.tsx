'use client';

import { useSearchParams } from 'next/navigation';
import MarketChartWorkspace from '@/components/market/MarketChartWorkspace';

export default function MarketData() {
  const searchParams = useSearchParams();
  const symbol = searchParams?.get('symbol') || 'BTCUSDT';
  const timeframe = searchParams?.get('timeframe') || '1D';
  const view = searchParams?.get('view');

  // Fullscreen modunda MarketChartWorkspace kendi layout'unu yönetir
  if (view === 'full') {
    return (
      <MarketChartWorkspace
        symbol={symbol}
        timeframe={timeframe}
        isFullscreen={true}
      />
    );
  }

  // Normal workspace modu: Figma parity market workspace
  // PATCH: Layout fix - chart alanı Copilot'a kadar genişlesin (boş kolon yok)
  return (
    <div className="h-full w-full flex flex-col min-h-0 min-w-0 flex-1 bg-neutral-950">
      <MarketChartWorkspace
        symbol={symbol}
        timeframe={timeframe}
      />
    </div>
  );
}

