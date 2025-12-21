"use client";
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import AuditTable from '@/components/audit/AuditTable';
import AuditFilters from '@/components/audit/AuditFilters';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { Surface } from '@/components/ui/Surface';

export default function Page() {
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { items, list, loading, total } = useAuditLogs('/api/public/audit-mock');

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    if (searchValue && !item.action?.toLowerCase().includes(searchValue.toLowerCase()) &&
        !item.actor?.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }
    if (categoryFilter) {
      // Map category filter to audit item category
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
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Denetim ve Karar Logları"
        subtitle="Sistem kararları, AI sinyalleri ve işlem kayıtlarının değişmez dökümü"
      />

      {/* Actions Row - Figma parity */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {/* TODO: Clear logs */}}
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 flex items-center gap-2"
          >
            <span>🗑️</span>
            <span>Temizle</span>
          </button>
          <button
            onClick={() => {/* TODO: Export CSV */}}
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 flex items-center gap-2"
          >
            <span>📥</span>
            <span>Dışa Aktar (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-4">
        <FilterBar
          chips={filterChips}
          searchPlaceholder="Loglarda ara..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </div>

      {/* Audit Table */}
      <Surface variant="card" className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-400">Yükleniyor…</div>
        ) : (
          <>
            <AuditTable rows={filteredItems} />
            <div className="px-4 py-3 border-t border-neutral-800 text-xs text-neutral-400">
              Toplam {filteredItems.length} kayıt listelendi
            </div>
            <div className="px-4 pb-3 text-xs text-neutral-500">
              Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
            </div>
          </>
        )}
      </Surface>
    </div>
  );
}
