'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import DenseStrategiesTable from '@/components/strategies/DenseStrategiesTable';
import { StrategyRow } from '@/components/strategies/DenseStrategiesTable';
import { uiCopy } from '@/lib/uiCopy';

export default function AllStrategiesPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<StrategyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadMore = async (nextCursor: string | null = null) => {
    if (loading) return;

    setLoading(true);
    try {
      const url = new URL('/api/strategies', window.location.origin);
      url.searchParams.set('limit', '50');
      if (nextCursor) {
        url.searchParams.set('cursor', nextCursor);
      }

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.strategies) {
          const mapped: StrategyRow[] = data.strategies.map((s: any) => ({
            id: s.id,
            strategy: s.name,
            market: 'Crypto',
            mode: 'live',
            openPositions: s._count?.positions || 0,
            exposure: 0,
            pnl24h: 0,
            pnl7d: 0,
            risk: 'Medium',
            status: s.status === 'active' ? 'running' : s.status,
            health: 'ok',
          }));

          if (nextCursor) {
            setStrategies(prev => [...prev, ...mapped]);
          } else {
            setStrategies(mapped);
          }

          setCursor(data.nextCursor);
          setHasMore(data.hasMore || false);
        }
      }
    } catch (e) {
      console.error('Error loading strategies:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <PageContainer size="wide">
      <div className="space-y-3 pb-4">
        <PageHeader
          title="Tüm Stratejiler"
          subtitle={`${strategies.length} strateji listeleniyor`}
        />

        <DenseStrategiesTable
          columns={['Strateji', 'Piyasa', 'Mod', 'Açık Poz.', 'Maruziyet', 'PnL 24h', 'PnL 7d', 'Risk', 'Sağlık', 'Durum', 'İşlemler']}
          data={strategies}
          variant="running-strategies"
          onStatusChange={(id, status) => console.log('Status change', id, status)}
        />

        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => cursor && loadMore(cursor)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
            >
              {loading ? 'Yükleniyor...' : 'Daha fazla yükle'}
            </button>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Geri dön
          </button>
        </div>
      </div>
    </PageContainer>
  );
}

