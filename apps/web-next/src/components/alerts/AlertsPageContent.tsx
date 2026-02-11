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
import { ClientTime } from '@/components/common/ClientTime';

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
  // PATCH CONTROL-OPT-2: Bulk actions dropdown state
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

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
    <div className="flex flex-col min-h-0 h-full">
      <PageHeader
        title="Uyarılar"
        subtitle="Fiyat, P&L ve risk seviyeleri için bildirim ayarları"
      />

      {/* Summary Stats - PATCH P: MetricTile standardı */}
      {/* PATCH SCROLL-OPT: Empty durumda kompakt mod (KPI kartları scroll tetiklemesin) */}
      {totalAlerts === 0 ? (
        <div className="flex flex-wrap gap-2 mb-4 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800 text-xs">
            <span className="text-neutral-400">Toplam:</span> <span className="text-neutral-200 font-medium">0</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800 text-xs">
            <span className="text-neutral-400">Aktif:</span> <span className="text-neutral-200 font-medium">0</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800 text-xs">
            <span className="text-neutral-400">Bugün:</span> <span className="text-neutral-200 font-medium">0</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800 text-xs">
            <span className="text-neutral-400">Beklemede:</span> <span className="text-neutral-200 font-medium">0</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
          <StatCard label="Toplam Uyarı" value={totalAlerts} />
          <StatCard label="Aktif" value={activeAlerts} />
          <StatCard label="Bugün Tetiklenen" value={triggeredToday} />
          <StatCard label="Beklemede" value={pendingAlerts} />
        </div>
      )}

      {/* PATCH NOSCROLL-EMPTY: Empty durumda filtre/arama/action bar yok (scroll önleme) */}
      {totalAlerts > 0 && (
        <>
          {/* Actions Row - PATCH CONTROL-OPT-2: Normal buton boyutu + şablon dropdown */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <a href="/technical-analysis" className="text-sm text-blue-400 hover:text-blue-300">
                Uyarı Geçmişini Gör
              </a>
            </div>
            <div className="flex items-center gap-2">
              {/* Şablonlar dropdown */}
              <div className="relative">
                <button
                  onClick={() => {/* TODO: Template dropdown */}}
                  className="px-3 py-1.5 text-sm rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 transition-colors"
                >
                  Şablonlar ▼
                </button>
              </div>
              <button
                onClick={() => {/* TODO: Create alert modal */}}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors"
              >
                <span>+</span>
                <span>Yeni Uyarı</span>
              </button>
            </div>
          </div>

          {/* Filter Bar + Bulk Actions - PATCH CONTROL-OPT-2: Bulk actions toolbar sağında dropdown */}
          <div className="mb-4 flex items-center justify-between gap-3 shrink-0">
            <div className="flex-1">
              <FilterBar
                chips={filterChips}
                searchPlaceholder="Ara..."
                searchValue={searchValue}
                onSearchChange={setSearchValue}
              />
            </div>
        {filteredItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 transition-colors flex items-center gap-1.5"
            >
              <span>Toplu İşlemler</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                {filteredItems.length}
              </span>
              <span className="text-xs">▼</span>
            </button>
            {bulkMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setBulkMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => {
                      if (confirm('Tüm uyarıları duraklatmak istediğinizden emin misiniz?')) {
                        // TODO: Pause all
                        setBulkMenuOpen(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    Tümünü Duraklat
                  </button>
                  <button
                    onClick={() => {
                      const triggeredCount = filteredItems.filter(a => a.status === 'triggered').length;
                      if (triggeredCount > 0 && confirm(`Tetiklenen ${triggeredCount} uyarıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                        // TODO: Delete triggered
                        setBulkMenuOpen(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-red-900/20 transition-colors"
                  >
                    Tetiklenenleri Sil
                  </button>
                </div>
              </>
            )}
          </div>
        )}
          </div>
        </>
      )}

      {/* PATCH B: Liste alanı - flex-1 min-h-0 ile kalan alanı doldur */}
      {/* PATCH SCROLL-OPT: Empty state kompakt (flex-1 justify-center scroll üretiyordu) */}
      <div className="flex-1 min-h-0 flex flex-col">
        {displayItems.length === 0 ? (
          <div className="w-full h-full">
            {/* PATCH 3: 2-col empty state - terminal density */}
            <div className="grid lg:grid-cols-2 gap-4 h-full">
              {/* Sol: Şablonlar + Create CTA + Quick Steps */}
              <Surface variant="card" className="p-6 flex flex-col">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🔔</div>
                  <div className="text-base font-medium text-neutral-200">Henüz uyarı yok</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Fiyat, P&L veya risk seviyeleri için bildirim oluşturun
                  </div>
                </div>

                {/* Şablonlar */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-medium text-neutral-400 mb-2">Hızlı Şablonlar</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {/* TODO: Create from template - Fiyat */}}
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 hover:text-white border border-neutral-700 transition-colors"
                    >
                      📊 Fiyat
                    </button>
                    <button
                      onClick={() => {/* TODO: Create from template - RSI */}}
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 hover:text-white border border-neutral-700 transition-colors"
                    >
                      📈 RSI
                    </button>
                    <button
                      onClick={() => {/* TODO: Create from template - Risk */}}
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 hover:text-white border border-neutral-700 transition-colors"
                    >
                      ⚠️ Risk
                    </button>
                    <button
                      onClick={() => {/* TODO: Create from template - Sistem */}}
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 hover:text-white border border-neutral-700 transition-colors"
                    >
                      🔧 Sistem
                    </button>
                  </div>
                </div>

                {/* Create CTA */}
                <button
                  onClick={() => {/* TODO: Create alert modal */}}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors mb-4"
                >
                  + Yeni Uyarı Oluştur
                </button>

                {/* Quick Steps */}
                <div className="mt-auto pt-4 border-t border-neutral-800">
                  <div className="text-xs font-medium text-neutral-400 mb-2">Hızlı Kurulum (3 adım)</div>
                  <div className="space-y-1.5 text-xs text-neutral-500">
                    <div>1. Şablon seç veya özel koşul tanımla</div>
                    <div>2. Tetikleme kanallarını ayarla</div>
                    <div>3. Test et ve aktif et</div>
                  </div>
                </div>
              </Surface>

              {/* Sağ: Recent Triggers (Demo) + Pipeline Health */}
              <div className="flex flex-col gap-4">
                {/* Recent Triggers */}
                <Surface variant="card" className="p-4 flex-1">
                  <div className="text-xs font-medium text-neutral-400 mb-3 flex items-center justify-between">
                    <span>Son Tetiklenenler (Demo)</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">Demo</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { symbol: 'BTC/USDT', type: 'Fiyat', condition: '> $42,000', timestamp: Date.now() - 120000 },
                      { symbol: 'ETH/USDT', type: 'RSI', condition: 'RSI < 30', timestamp: Date.now() - 900000 },
                      { symbol: 'SOL/USDT', type: 'Risk', condition: 'DD > 5%', timestamp: Date.now() - 1000 },
                    ].map((trigger, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-neutral-900/50 rounded border border-neutral-800">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-neutral-200 truncate">{trigger.symbol}</div>
                          <div className="text-[10px] text-neutral-400">{trigger.type}: {trigger.condition}</div>
                        </div>
                        <div className="text-[10px] text-neutral-500 ml-2">
                          <ClientTime value={trigger.timestamp} format="relative" minWidth="10ch" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>

                {/* Pipeline Health */}
                <Surface variant="card" className="p-4">
                  <div className="text-xs font-medium text-neutral-400 mb-3">Alert Pipeline Health</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-300">Executor</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-300">Risk Gate</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-300">Notification</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">1 pending</span>
                    </div>
                  </div>
                </Surface>
              </div>
            </div>
          </div>
        ) : (
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
                {displayItems.map((item) => (
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
                ))}
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
        )}
      </div>
    </div>
  );
}

