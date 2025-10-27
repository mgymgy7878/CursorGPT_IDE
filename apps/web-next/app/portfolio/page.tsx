import React from 'react';
import { PortfolioCard, MetricRow } from '@/components/portfolio/PortfolioCard';
import { PositionTable } from '@/components/portfolio/PositionTable';
import { formatCurrency, formatCurrencyWithColor } from '@/lib/utils/currency';

/**
 * Portfolio Page
 * Displays exchange connection status, total PnL, account summary, and open positions
 * 
 * Data flow: SSR fetch from /api/mock/portfolio → render cards → client-side hydration
 */

interface PortfolioData {
  exchange: {
    name: string;
    online: boolean;
    lastSyncSec: number;
    rateLimit: string;
    apiStatus: string;
  };
  totals: {
    pnl24hUSD: number;
    totalUSD: number;
    freeUSD: number;
    lockedUSD: number;
  };
  positions: Array<{
    symbol: string;
    qty: number;
    avgPrice: number;
    currentPrice: number;
    pnlUSD: number;
    pnlPct: number;
    side?: 'long' | 'short';
  }>;
  timestamp: string;
}

async function getPortfolioData(): Promise<PortfolioData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
  
  try {
    const res = await fetch(`${baseUrl}/api/mock/portfolio`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch portfolio data: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Portfolio data fetch error:', error);
    
    // Return fallback data
    return {
      exchange: {
        name: 'Binance',
        online: false,
        lastSyncSec: 0,
        rateLimit: '0/1200',
        apiStatus: 'offline',
      },
      totals: {
        pnl24hUSD: 0,
        totalUSD: 0,
        freeUSD: 0,
        lockedUSD: 0,
      },
      positions: [],
      timestamp: new Date().toISOString(),
    };
  }
}

export default async function PortfolioPage() {
  const data = await getPortfolioData();
  
  const pnlFormatted = formatCurrencyWithColor(data.totals.pnl24hUSD, {
    showPositiveSign: true,
    decimals: 2,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-strong mb-2">Portföy</h1>
        <p className="text-sm text-text-muted">Canlı pozisyonlar, PnL ve borsa durumu</p>
      </div>

      {/* Top Row: Exchange, PnL, Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Exchange Connection Card */}
        <PortfolioCard
          title="Borsa Bağlantısı"
          testId="portfolio-exchange"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Binance Logo Placeholder */}
              <div className="w-10 h-10 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center">
                <span className="text-lg font-bold text-warning">B</span>
              </div>
              <div>
                <p className="text-base font-semibold text-text-strong">{data.exchange.name}</p>
                <p className="text-xs text-text-muted">
                  {data.exchange.online ? 'Bağlı' : 'Bağlantı Yok'}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                data.exchange.online
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-danger/10 text-danger border border-danger/20'
              }`}
            >
              {data.exchange.online ? 'Çevrimiçi' : 'Çevrimdışı'}
            </span>
          </div>

          <div className="space-y-2 pt-3 border-t border-border">
            <MetricRow label="API Status" value={`✓ ${data.exchange.apiStatus}`} />
            <MetricRow
              label="Last Sync"
              value={`${Math.floor(data.exchange.lastSyncSec / 60)} dk önce`}
            />
            <MetricRow label="Rate Limit" value={data.exchange.rateLimit} />
          </div>
        </PortfolioCard>

        {/* Total PnL Card */}
        <PortfolioCard
          title="Toplam PnL (canlı)"
          testId="portfolio-pnl"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
        >
          <div>
            <p className={`text-3xl font-bold tabular ${pnlFormatted.className}`}>
              {pnlFormatted.formatted}
            </p>
            <p className="text-sm text-text-muted mt-1">24 saat P&L</p>
          </div>

          <div className="space-y-2 pt-3 border-t border-border">
            <MetricRow
              label="Toplam Bakiye"
              value={formatCurrency(data.totals.totalUSD, { decimals: 2 })}
            />
            <MetricRow
              label="Kullanılabilir"
              value={formatCurrency(data.totals.freeUSD, { decimals: 2 })}
            />
            <MetricRow
              label="Emirde"
              value={formatCurrency(data.totals.lockedUSD, { decimals: 2 })}
            />
          </div>
        </PortfolioCard>

        {/* Account Summary Card */}
        <PortfolioCard
          title="Hesap Özeti"
          testId="portfolio-summary"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        >
          <div className="space-y-3">
            <div>
              <p className="text-sm text-text-muted mb-1">Toplam Bakiye</p>
              <p className="text-2xl font-bold text-text-strong tabular">
                {formatCurrency(data.totals.totalUSD, { decimals: 2 })}
              </p>
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-sm text-text-muted mb-1">Kullanılabilir</p>
              <p className="text-2xl font-bold text-text-strong tabular">
                {formatCurrency(data.totals.freeUSD, { decimals: 2 })}
              </p>
            </div>
          </div>
        </PortfolioCard>
      </div>

      {/* Open Positions Section */}
      <div>
        <h2 className="text-lg font-semibold text-text-strong mb-4">Açık Pozisyonlar</h2>
        <PositionTable
          positions={data.positions}
          onClosePosition={(symbol) => {
            console.log('Close position:', symbol);
            // TODO: Implement close position logic
          }}
          onReversePosition={(symbol) => {
            console.log('Reverse position:', symbol);
            // TODO: Implement reverse position logic
          }}
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Portföy | Spark Trading',
  description: 'Canlı pozisyonlar, PnL ve borsa durumu',
};

