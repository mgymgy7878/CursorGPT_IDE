import React from 'react';
import Link from 'next/link';
import { MiniRunning } from '@/components/home/MiniRunning';
import { MarketMini, MarketTicker } from '@/components/home/MarketMini';
import { RunningStrategy } from '@/components/running/RunningTable';

/**
 * Homepage / Dashboard
 * Overview of system status, running strategies, and market data
 */

interface HomeData {
  runningStrategies: RunningStrategy[];
  marketTickers: MarketTicker[];
}

async function getHomeData(): Promise<HomeData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

  try {
    const [runningRes, marketRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/mock/running`, {
        cache: 'no-store',
        next: { revalidate: 0 },
      }),
      fetch(`${baseUrl}/api/mock/market`, {
        cache: 'no-store',
        next: { revalidate: 0 },
      }),
    ]);

    const runningData =
      runningRes.status === 'fulfilled' && runningRes.value.ok
        ? await runningRes.value.json()
        : { strategies: [] };

    const marketData =
      marketRes.status === 'fulfilled' && marketRes.value.ok
        ? await marketRes.value.json()
        : { tickers: [] };

    return {
      runningStrategies: runningData.strategies || [],
      marketTickers: marketData.tickers || [],
    };
  } catch (error) {
    console.error('Home data fetch error:', error);
    return {
      runningStrategies: [],
      marketTickers: [],
    };
  }
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <main className="space-y-6">
      {/* Status Pills */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-pill-bg">
          <span className="text-xs font-medium text-text-base">Env: Mock</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-success/20 bg-success/10">
          <span className="text-xs font-medium text-success">Feed: Healthy</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-warning/20 bg-warning/10">
          <span className="text-xs font-medium text-warning">Broker: Offline</span>
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-strong mb-2">Anasayfa</h1>
        <p className="text-sm text-text-muted">Özet dashboard</p>
      </div>

      {/* Three Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Copilot Card */}
        <section className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-text-strong">AI Copilot</h2>
          </div>

          <p className="text-sm text-text-muted mb-4">
            Piyasa durumunu analiz et, fırsat öner, strateji seç...
          </p>

          <textarea
            className="input w-full h-24 resize-none mb-4"
            placeholder="Başlamak için bir strateji isteği yazın. Örnek: BTCUSDT 1h EMA crossover stratejisi..."
            aria-label="AI Copilot prompt"
          />

          <div className="flex gap-2">
            <button className="btn-primary flex-1">
              <span className="flex items-center justify-center gap-2">
                🔎 Analiz Et
              </span>
            </button>
            <Link href="/strategy-lab" className="btn flex-1 text-center">
              Strategy Lab →
            </Link>
          </div>
        </section>

        {/* Running Strategies Mini Widget */}
        <MiniRunning items={data.runningStrategies} />

        {/* Market Data Mini Widget */}
        <MarketMini tickers={data.marketTickers} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/strategies"
          className="bg-card rounded-lg border border-border p-4 hover:border-border-hover hover:bg-bg-card-hover transition-all"
        >
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-text-strong">Yeni Strateji</h3>
              <p className="text-xs text-text-muted">Strateji oluştur veya düzenle</p>
            </div>
          </div>
        </Link>

        <Link
          href="/portfolio"
          className="bg-card rounded-lg border border-border p-4 hover:border-border-hover hover:bg-bg-card-hover transition-all"
        >
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-text-strong">Portföy</h3>
              <p className="text-xs text-text-muted">Pozisyonlar ve bakiye</p>
            </div>
          </div>
        </Link>

        <Link
          href="/settings"
          className="bg-card rounded-lg border border-border p-4 hover:border-border-hover hover:bg-bg-card-hover transition-all"
        >
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-text-strong">Ayarlar</h3>
              <p className="text-xs text-text-muted">API ve bağlantı ayarları</p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}

export const metadata = {
  title: 'Anasayfa | Spark Trading',
  description: 'Özet dashboard',
};

