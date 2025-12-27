/**
 * AlertsPageContent - Figma Parity Alerts Page
 *
 * Figma tasarımına göre:
 * - Summary stats (Toplam Uyarı, Aktif, Bugün Tetiklenen, Beklemede)
 * - Filter tabs (Tümü, Fiyat, P&L, Risk, Sistem)
 * - Search + bulk actions
 * - Alert listesi (tablo formatında)
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { Surface } from '@/components/ui/Surface';
import { StatCard } from '@/components/ui/StatCard';
import { cardHeader, badgeVariant } from '@/styles/uiTokens';
import { cn } from '@/lib/utils';

export interface AlertItem {
  id: string;
  symbol: string;
  strategy: string;
  condition: string;
  type: 'price' | 'pnl' | 'risk' | 'system';
  status: 'active' | 'triggered' | 'paused';
  createdAt: string;
  lastTriggered?: string;
  channels: string[];
}

interface AlertsPageContentProps {
  items: AlertItem[];
  loading: boolean;
  onRefresh: () => void;
  onEnable: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  /** UI-1: Compact mode - show only first 3 items + "Show all" button */
  compact?: boolean;
  onShowAll?: () => void;
}

export default function AlertsPageContent({
  items,
  loading,
  onRefresh,
  onEnable,
  onDelete,
  onEdit,
  compact = false,
  onShowAll,
}: AlertsPageContentProps) {
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Summary stats
  const totalAlerts = items.length;
  const activeAlerts = items.filter(a => a.status === 'active').length;
  const triggeredToday = items.filter(a => a.status === 'triggered' && a.lastTriggered).length;
  const pendingAlerts = items.filter(a => a.status === 'paused').length;

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (searchValue && !item.symbol.toLowerCase().includes(searchValue.toLowerCase()) &&
        !item.strategy.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }
    if (typeFilter && item.type !== typeFilter) {
      return false;
    }
    return true;
  });

  // UI-1: Compact mode - show only first 3
  const displayItems = compact ? filteredItems.slice(0, 3) : filteredItems;
  const hasMore = compact && filteredItems.length > 3;

  const filterChips = [
    { id: 'all', label: `Tümü (${totalAlerts})`, active: typeFilter === null, onClick: () => setTypeFilter(null) },
    { id: 'price', label: `Fiyat (${items.filter(a => a.type === 'price').length})`, active: typeFilter === 'price', onClick: () => setTypeFilter('price') },
    { id: 'pnl', label: `P&L (${items.filter(a => a.type === 'pnl').length})`, active: typeFilter === 'pnl', onClick: () => setTypeFilter('pnl') },
    { id: 'risk', label: `Risk (${items.filter(a => a.type === 'risk').length})`, active: typeFilter === 'risk', onClick: () => setTypeFilter('risk') },
    { id: 'system', label: `Sistem (${items.filter(a => a.type === 'system').length})`, active: typeFilter === 'system', onClick: () => setTypeFilter('system') },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Uyarılar"
        subtitle="Fiyat, P&L ve risk seviyeleri için bildirim ayarları"
      />

      {/* Summary Stats - PATCH P: MetricTile standardı */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Toplam Uyarı" value={totalAlerts} />
        <StatCard label="Aktif" value={activeAlerts} />
        <StatCard label="Bugün Tetiklenen" value={triggeredToday} />
        <StatCard label="Beklemede" value={pendingAlerts} />
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <a href="/technical-analysis" className="text-sm text-blue-400 hover:text-blue-300">
            Uyarı Geçmişini Gör
          </a>
        </div>
        <button
          onClick={() => {/* TODO: Create alert modal */}}
          className="px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white flex items-center gap-2"
          style={{ height: 'var(--control-h, 36px)' }}
        >
          <span>+</span>
          <span>Yeni Uyarı Oluştur</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mb-4">
        <FilterBar
          chips={filterChips}
          searchPlaceholder="Ara..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => {/* TODO: Pause all */}}
          className="px-3 py-1.5 text-sm rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300"
        >
          Tümünü Duraklat
        </button>
        <button
          onClick={() => {/* TODO: Delete triggered */}}
          className="px-3 py-1.5 text-sm rounded-lg border border-red-700 hover:bg-red-900/20 text-red-300"
        >
          Tetiklenenleri Sil
        </button>
      </div>

      {/* Alert Table */}
      <Surface variant="card" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left bg-neutral-900/50 border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4 text-neutral-300 font-medium">Sembol</th>
                <th className="py-3 px-4 text-neutral-300 font-medium">Strateji</th>
                <th className="py-3 px-4 text-neutral-300 font-medium">Koşul</th>
                <th className="py-3 px-4 text-neutral-300 font-medium">Oluşturulma</th>
                <th className="py-3 px-4 text-neutral-300 font-medium">Son Tetiklenme</th>
                <th className="py-3 px-4 text-neutral-300 font-medium">Durum</th>
                <th className="py-3 px-4 text-neutral-300 font-medium">Kanal</th>
                <th className="py-3 px-4 text-right text-neutral-300 font-medium">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <>
                  {/* Example Template Cards */}
                  <tr>
                    <td colSpan={8} className="py-6">
                      <div className="grid md:grid-cols-3 gap-3 mb-6">
                        <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-900/30 opacity-60">
                          <div className="text-sm font-medium text-neutral-300 mb-1">RSI {'>'} 70</div>
                          <div className="text-xs text-neutral-500">Fiyat: RSI aşırı alım seviyesi</div>
                          <div className="mt-2 text-xs text-neutral-600">Örnek şablon (devre dışı)</div>
                        </div>
                        <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-900/30 opacity-60">
                          <div className="text-sm font-medium text-neutral-300 mb-1">PnL Günlük -%X</div>
                          <div className="text-xs text-neutral-500">Risk: Günlük zarar limiti</div>
                          <div className="mt-2 text-xs text-neutral-600">Örnek şablon (devre dışı)</div>
                        </div>
                        <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-900/30 opacity-60">
                          <div className="text-sm font-medium text-neutral-300 mb-1">WS Disconnect</div>
                          <div className="text-xs text-neutral-500">Sistem: WebSocket bağlantı kesildi</div>
                          <div className="mt-2 text-xs text-neutral-600">Örnek şablon (devre dışı)</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={8} className="py-12">
                      <div className="text-center space-y-3">
                        <div className="text-4xl mb-2">🔔</div>
                        <div className="text-lg font-medium text-neutral-200">Henüz alert yok</div>
                        <div className="text-sm text-neutral-400 max-w-md mx-auto">
                          Fiyat, P&L veya risk seviyeleri için bildirim oluşturarak başlayın
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-4">
                          <button
                            onClick={() => {/* TODO: Create alert modal */}}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
                          >
                            + Yeni Uyarı Oluştur
                          </button>
                          <a
                            href="/technical-analysis"
                            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-neutral-200 transition-colors"
                          >
                            Technical Analysis → Hızlı Uyarı
                          </a>
                        </div>
                        <div className="text-xs text-neutral-500 mt-3 max-w-md mx-auto">
                          Uyarılar executor + risk gate'den tetiklenir. Aktif uyarılar burada görünecek.
                        </div>
                      </div>
                    </td>
                  </tr>
                </>
              ) : (
                displayItems.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-900 hover:bg-neutral-900/30">
                    <td className="py-3 px-4 font-semibold text-neutral-200">{item.symbol}</td>
                    <td className="py-3 px-4 text-neutral-300">{item.strategy}</td>
                    <td className="py-3 px-4 text-neutral-300">{item.condition}</td>
                    <td className="py-3 px-4 text-neutral-400 text-xs">{item.createdAt}</td>
                    <td className="py-3 px-4 text-neutral-400 text-xs">
                      {item.lastTriggered || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        badgeVariant(
                          item.status === 'active' ? 'success' :
                          item.status === 'triggered' ? 'warning' : 'default'
                        )
                      )}>
                        {item.status === 'active' ? 'Active' :
                         item.status === 'triggered' ? 'Triggered' : 'Paused'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-400 text-xs">
                      {item.channels.join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEnable(item.id, item.status !== 'active')}
                          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                          title={item.status === 'active' ? 'Duraklat' : 'Devam Et'}
                        >
                          {item.status === 'active' ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => onEdit(item.id)}
                          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                          title="Düzenle"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 rounded hover:bg-red-900/20 text-neutral-400 hover:text-red-300"
                          title="Sil"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* UI-1: Compact mode - "Tümünü gör" button */}
          {hasMore && (
            <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-center">
              <button
                onClick={onShowAll || (() => {/* TODO: Expand to full view */})}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                Tümünü gör ({filteredItems.length - 3} daha)
              </button>
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}

