'use client';

import { useState } from 'react';
import AppFrame from '@/components/layout/AppFrame';
import AuditTable from '@/components/audit/AuditTable';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { Surface } from '@/components/ui/Surface';
import { AuditItem } from '@/hooks/useAuditLogs';

export const dynamic = 'force-dynamic';

// Deterministic mock data for Golden Master
const MOCK_AUDIT_LOGS: AuditItem[] = [
  {
    time: '2024-12-21T11:17:32.826Z',
    actor: 'system',
    action: 'SYSTEM_INIT',
    target: 'Spark Trading Terminal v1.0.4',
    status: 'ok',
    auditId: 'audit-001',
  },
  {
    time: '2024-12-21T11:17:42.826Z',
    actor: 'market_data',
    action: 'MARKET_CONNECT',
    target: 'Binance Spot via WebSocket',
    status: 'ok',
    auditId: 'audit-002',
  },
  {
    time: '2024-12-21T11:17:47.826Z',
    actor: 'strategy_engine',
    action: 'AI_STRATEGY_LOAD',
    target: 'Trend Follower v1 loaded for BTCUSDT',
    status: 'ok',
    auditId: 'audit-003',
  },
];

export default function GoldenMasterAuditPage() {
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filteredItems = MOCK_AUDIT_LOGS.filter((item) => {
    if (searchValue && !item.action?.toLowerCase().includes(searchValue.toLowerCase()) &&
        !item.actor?.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }
    if (categoryFilter) {
      const itemCategory = item.action?.toUpperCase() || '';
      if (categoryFilter === 'MARKET' && !itemCategory.includes('MARKET')) return false;
      if (categoryFilter === 'AI_STRATEGY' && !itemCategory.includes('STRATEGY') && !itemCategory.includes('AI')) return false;
      if (categoryFilter === 'TRADE' && !itemCategory.includes('TRADE')) return false;
      if (categoryFilter === 'RISK' && !itemCategory.includes('RISK')) return false;
      if (categoryFilter === 'SYSTEM' && !itemCategory.includes('SYSTEM')) return false;
    }
    return true;
  });

  const filterChips = [
    { id: 'all', label: 'Tümü', active: categoryFilter === null, onClick: () => setCategoryFilter(null) },
    { id: 'market', label: 'MARKET', active: categoryFilter === 'MARKET', onClick: () => setCategoryFilter('MARKET') },
    { id: 'ai_strategy', label: 'AI_STRATEGY', active: categoryFilter === 'AI_STRATEGY', onClick: () => setCategoryFilter('AI_STRATEGY') },
    { id: 'trade', label: 'TRADE', active: categoryFilter === 'TRADE', onClick: () => setCategoryFilter('TRADE') },
    { id: 'risk', label: 'RISK', active: categoryFilter === 'RISK', onClick: () => setCategoryFilter('RISK') },
    { id: 'system', label: 'SYSTEM', active: categoryFilter === 'SYSTEM', onClick: () => setCategoryFilter('SYSTEM') },
  ];

  return (
    <AppFrame>
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title="Denetim ve Karar Logları"
          subtitle="Sistem kararları, AI sinyalleri ve işlem kayıtlarının değişmez dökümü"
        />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 flex items-center gap-2">
              <span>🗑️</span>
              <span>Temizle</span>
            </button>
            <button className="px-3 py-1.5 text-sm rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 flex items-center gap-2">
              <span>📥</span>
              <span>Dışa Aktar (CSV)</span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <FilterBar
            chips={filterChips}
            searchPlaceholder="Loglarda ara..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        </div>

        <Surface variant="card" className="overflow-hidden">
          <AuditTable rows={filteredItems} />
          <div className="px-4 py-3 border-t border-neutral-800 text-xs text-neutral-400">
            Toplam {filteredItems.length} kayıt listelendi
          </div>
          <div className="px-4 pb-3 text-xs text-neutral-500">
            Son güncelleme: 01:13:46
          </div>
        </Surface>
      </div>
    </AppFrame>
  );
}

