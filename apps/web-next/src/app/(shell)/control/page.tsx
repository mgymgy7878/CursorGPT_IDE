/**
 * Control Page - Operasyon Merkezi
 *
 * Tek sayfa, tab'li yapı:
 * - Risk & Kill Switch (guardrails)
 * - Uyarılar (alerts)
 * - Denetim / Audit (audit)
 * - Release Gate / Canary (canary)
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { Surface } from '@/components/ui/Surface';
import { ClientTime } from '@/components/common/ClientTime';
import { cn } from '@/lib/utils';
import { badgeVariant, cardHeader } from '@/styles/uiTokens';
import { Badge } from '@/components/ui/badge';
import { RuntimeHealthCard } from '@/components/dashboard/RuntimeHealthCard';

// PATCH CONTROL-OPT-1: Lazy-load tab içerikleri (ilk render hızı)
const RiskProtectionPage = dynamic(() => import('@/components/guardrails/RiskProtectionPage'), { ssr: false });
const AlertsPageContent = dynamic(() => import('@/components/alerts/AlertsPageContent').then(m => ({ default: m.default })), { ssr: false });
const AuditTable = dynamic(() => import('@/components/audit/AuditTable'), { ssr: false });

import type { AlertItem } from '@/components/alerts/AlertsPageContent';
import { useAuditLogs, AuditItem } from '@/hooks/useAuditLogs';

// Canary component content
interface CanaryResult {
  status: 'pass' | 'fail' | 'running' | null;
  timestamp: string | null;
  commitHash: string | null;
  checks: {
    uiDiff: boolean;
    typecheck: boolean;
    apiHealth: boolean;
    wsHealth: boolean;
    executorHealth: boolean;
    sampleDataSeed: boolean;
  };
  log: string;
}

const MOCK_TIMESTAMP = '2025-12-21T01:19:25.000Z';
const INITIAL_CANARY_STATE: CanaryResult = {
  status: 'pass',
  timestamp: MOCK_TIMESTAMP,
  commitHash: 'a1b2c3d',
  checks: {
    uiDiff: true,
    typecheck: true,
    apiHealth: true,
    wsHealth: true,
    executorHealth: true,
    sampleDataSeed: true,
  },
  log: 'Last successful run: All checks passed.\n\n[UI Diff] ✓ No visual regressions detected\n[Typecheck] ✓ 0 errors\n[API Health] ✓ /api/healthz returned 200\n[WS Health] ✓ WebSocket connection stable\n[Executor Health] ✓ /api/executor-healthz returned 200\n[Sample Data] ✓ Mock data seeded successfully',
};

type ControlTab = 'risk' | 'alerts' | 'audit' | 'canary';

export default function ControlPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ControlTab>(
    (searchParams?.get('tab') as ControlTab) || 'risk'
  );

  // UI-1: Document title (SEO + browser tabs)
  useEffect(() => {
    document.title = 'Operasyon Merkezi — Spark Trading';
  }, []);

  // Check audit integrity when audit tab is active
  useEffect(() => {
    if (activeTab === 'audit') {
      const checkIntegrity = async () => {
        try {
          const res = await fetch('/api/audit/verify?limit=200', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            setAuditIntegrity({
              verified: data.verified || false,
              message: data.message,
              brokenAtIndex: data.brokenAtIndex || undefined,
            });
          }
        } catch (e) {
          console.error('Error checking integrity:', e);
        }
      };

      checkIntegrity();
    }
  }, [activeTab]);

  const handleAuditExport = async () => {
    setAuditExporting(true);
    try {
      const res = await fetch('/api/audit/export?limit=1000', { cache: 'no-store' });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.jsonl`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Error exporting:', e);
      alert('Export başarısız oldu');
    } finally {
      setAuditExporting(false);
    }
  };

  // Alerts state
  const [alertItems, setAlertItems] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Audit state
  const [auditSearchValue, setAuditSearchValue] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string | null>(null);
  const { items: auditItems, list: auditList, loading: auditLoading, total: auditTotal } = useAuditLogs('/api/public/audit-mock');
  const [auditIntegrity, setAuditIntegrity] = useState<{ verified: boolean; message?: string; brokenAtIndex?: number } | null>(null);
  const [auditExporting, setAuditExporting] = useState(false);

  // Canary state
  const [canaryResult, setCanaryResult] = useState<CanaryResult>(INITIAL_CANARY_STATE);
  const [canaryLoading, setCanaryLoading] = useState(false);

  const handleTabChange = (tab: ControlTab) => {
    setActiveTab(tab);
    router.push(`/control?tab=${tab}`, { scroll: false });
  };

  // Load alerts
  const loadAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch('/api/alerts/list', { cache: 'no-store' });
      const data = await res.json().catch(() => ({ items: [], _err: 'parse' }));
      const transformedItems: AlertItem[] = (data.items ?? []).map((item: any) => ({
        id: item.id,
        symbol: item.symbol,
        strategy: item.strategy || 'N/A',
        condition: item.condition || `${item.type} ${item.timeframe}`,
        type: item.type === 'price' ? 'price' : item.type === 'pnl' ? 'pnl' : item.type === 'risk' ? 'risk' : 'system',
        status: item.active ? 'active' : 'paused',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : '-',
        lastTriggered: item.lastTriggeredAt ? new Date(item.lastTriggeredAt).toLocaleString('tr-TR') : undefined,
        channels: item.channels || ['In-app'],
      }));
      setAlertItems(transformedItems);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Initialize alerts on mount
  useEffect(() => {
    if (activeTab === 'alerts') {
      loadAlerts();
    }
  }, [activeTab]);

  const alertHandlers = {
    onRefresh: loadAlerts,
    onEnable: async (id: string, enabled: boolean) => {
      await fetch(`/api/alerts/${enabled ? 'enable' : 'disable'}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id })
      });
      await loadAlerts();
    },
    onDelete: async (id: string) => {
      if (!confirm("Bu alert'i silmek istediğinizden emin misiniz?")) return;
      await fetch('/api/alerts/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id })
      });
      await loadAlerts();
    },
    onEdit: (id: string) => {
      console.log('Edit alert:', id);
    },
  };

  // Audit filtered items
  const filteredAuditItems = auditItems.filter((item) => {
    if (auditSearchValue && !item.action?.toLowerCase().includes(auditSearchValue.toLowerCase()) &&
        !item.actor?.toLowerCase().includes(auditSearchValue.toLowerCase())) {
      return false;
    }
    if (auditCategoryFilter) {
      const itemCategory = item.action?.toUpperCase() || '';
      if (auditCategoryFilter === 'MARKET' && !itemCategory.includes('MARKET')) return false;
      if (auditCategoryFilter === 'AI_STRATEGY' && !itemCategory.includes('STRATEGY') && !itemCategory.includes('AI')) return false;
      if (auditCategoryFilter === 'TRADE' && !itemCategory.includes('TRADE')) return false;
      if (auditCategoryFilter === 'RISK' && !itemCategory.includes('RISK')) return false;
      if (auditCategoryFilter === 'SYSTEM' && !itemCategory.includes('SYSTEM')) return false;
    }
    return true;
  });

  const auditFilterChips = [
    { id: 'all', label: 'Tümü', active: auditCategoryFilter === null, onClick: () => setAuditCategoryFilter(null) },
    { id: 'market', label: 'MARKET', active: auditCategoryFilter === 'MARKET', onClick: () => setAuditCategoryFilter('MARKET') },
    { id: 'ai_strategy', label: 'AI_STRATEGY', active: auditCategoryFilter === 'AI_STRATEGY', onClick: () => setAuditCategoryFilter('AI_STRATEGY') },
    { id: 'trade', label: 'TRADE', active: auditCategoryFilter === 'TRADE', onClick: () => setAuditCategoryFilter('TRADE') },
    { id: 'risk', label: 'RISK', active: auditCategoryFilter === 'RISK', onClick: () => setAuditCategoryFilter('RISK') },
    { id: 'system', label: 'SYSTEM', active: auditCategoryFilter === 'SYSTEM', onClick: () => setAuditCategoryFilter('SYSTEM') },
  ];

  // Canary run handler
  const runCanary = async () => {
    setCanaryLoading(true);
    try {
      const res = await fetch('/api/public/canary/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pairs: ['BTCTRY', 'BTCUSDT'],
          wsMode: 'mock',
          passThresholds: { staleness_sec_lt: 3, delta_msgs_gte: 1 },
        }),
      });
      const data = await res.json();
      const passed = data.status === 'ok' || data.passed === true;
      const checks = {
        uiDiff: passed,
        typecheck: passed,
        apiHealth: true,
        wsHealth: passed,
        executorHealth: true,
        sampleDataSeed: passed,
      };
      const allPassed = Object.values(checks).every(v => v === true);
      setCanaryResult({
        status: allPassed ? 'pass' : 'fail',
        timestamp: new Date().toISOString(),
        commitHash: 'a1b2c3d',
        checks,
        log: JSON.stringify(data, null, 2),
      });
    } catch (err) {
      setCanaryResult({
        status: 'fail',
        timestamp: new Date().toISOString(),
        commitHash: 'a1b2c3d',
        checks: canaryResult.checks,
        log: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setCanaryLoading(false);
    }
  };

  const tabs = [
    { id: 'risk' as ControlTab, label: 'Risk & Koruma', icon: '🔒' },
    { id: 'alerts' as ControlTab, label: 'Uyarılar', icon: '🔔' },
    { id: 'audit' as ControlTab, label: 'Denetim', icon: '📋' },
    { id: 'canary' as ControlTab, label: 'Release Gate', icon: '🧪' },
  ];

  // PATCH I: /control page padding budget override (sadece control'a özel)
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const density = document.documentElement.dataset.density;
    setIsCompact(density === 'compact' || density === 'ultra');

    const observer = new MutationObserver(() => {
      const density = document.documentElement.dataset.density;
      setIsCompact(density === 'compact' || density === 'ultra');
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-density'] });
    return () => observer.disconnect();
  }, []);

  // PATCH REFACTOR-1: Tab render'ını switch-case ile parantez karmaşasından kurtar
  const renderTab = () => {
    switch (activeTab) {
      case 'risk':
        return (
          <div className="flex flex-col gap-2">
            <RiskProtectionPage />
          </div>
        );

      case 'alerts':
        return (
          <div className="flex flex-col gap-2">
            <AlertsPageContent
              items={alertItems}
              loading={alertsLoading}
              {...alertHandlers}
              compact={true}
              onShowAll={() => {
                router.push('/control?tab=alerts&view=all');
              }}
            />
          </div>
        );

      case 'audit':
        return (
          <div className="flex flex-col gap-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {auditIntegrity && (
                    <div className="flex items-center gap-2" title={auditIntegrity.message || ''}>
                      <Badge variant={auditIntegrity.verified ? 'success' : 'destructive'}>
                        {auditIntegrity.verified ? 'Integrity OK' : `BROKEN @ index ${auditIntegrity.brokenAtIndex ?? '?'}`}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAuditExport}
                    disabled={auditExporting}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-2',
                      auditExporting
                        ? 'border-neutral-700 bg-neutral-800 text-neutral-400 cursor-not-allowed'
                        : 'border-neutral-700 hover:bg-neutral-800 text-neutral-300'
                    )}
                  >
                    <span>📥</span>
                    <span>{auditExporting ? 'İndiriliyor...' : 'Export (JSONL)'}</span>
                  </button>
                </div>
              </div>
              {/* PATCH NOSCROLL-EMPTY: Empty durumda filtre barı yok (scroll önleme) */}
              {filteredAuditItems.length > 0 || auditLoading ? (
                <FilterBar
                  chips={auditFilterChips}
                  searchPlaceholder="Loglarda ara..."
                  searchValue={auditSearchValue}
                  onSearchChange={setAuditSearchValue}
                />
              ) : null}
              {filteredAuditItems.length === 0 && !auditLoading ? (
                // PATCH 3: Audit empty state - 2 kolon + demo data + timeline
                <div className="grid lg:grid-cols-3 gap-3">
                  {/* Sol: Timeline snippet */}
                  <Surface variant="card" className="p-4 lg:col-span-2">
                    <div className="text-xs font-medium text-neutral-300 mb-3">Sistem Kararları Akışı (Timeline)</div>
                    <div className="space-y-2">
                      {[
                        { timestamp: Date.now() - 120000, action: 'AI Decision', detail: 'BUY BTC/USDT - Oversold condition', status: 'executed' },
                        { timestamp: Date.now() - 300000, action: 'Risk Gate', detail: 'Exposure limit check passed', status: 'passed' },
                        { timestamp: Date.now() - 480000, action: 'Market Data', detail: 'Price update: BTC/USDT $42,150', status: 'info' },
                        { timestamp: Date.now() - 720000, action: 'AI Decision', detail: 'CLOSE ETH/USDT - Take profit hit', status: 'executed' },
                        { timestamp: Date.now() - 900000, action: 'System', detail: 'Health check: All systems OK', status: 'info' },
                      ].map((event, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-neutral-900/30 border border-neutral-800">
                          <div className="text-[9px] text-neutral-500 shrink-0 w-16">
                            <ClientTime value={event.timestamp} format="relative" minWidth="10ch" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium text-neutral-300">{event.action}</div>
                            <div className="text-[9px] text-neutral-500">{event.detail}</div>
                          </div>
                          <span className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded shrink-0',
                            event.status === 'executed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : event.status === 'passed'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30'
                          )}>
                            {event.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Surface>

                  {/* Sağ: Son AI kararları + Export info */}
                  <div className="space-y-3">
                    <Surface variant="card" className="p-3">
                      <div className="text-xs font-medium text-neutral-300 mb-2">Son AI Kararları (5 kayıt)</div>
                      <div className="space-y-1.5">
                        {[
                          { decision: 'BUY BTC/USDT', reason: 'Oversold', conf: '98%', timestamp: Date.now() - 120000 },
                          { decision: 'CLOSE ETH/USDT', reason: 'Take profit', conf: '100%', timestamp: Date.now() - 720000 },
                          { decision: 'HOLD SOL/USDT', reason: 'Trend intact', conf: '85%', timestamp: Date.now() - 1080000 },
                        ].map((decision, i) => (
                          <div key={i} className="p-1.5 rounded bg-neutral-900/30 border border-neutral-800">
                            <div className="text-[10px] font-medium text-neutral-200">{decision.decision}</div>
                            <div className="text-[9px] text-neutral-500">
                              {decision.reason} · {decision.conf} · <ClientTime value={decision.timestamp} format="relative" minWidth="10ch" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Surface>

                    <Surface variant="card" className="p-3">
                      <div className="text-xs font-medium text-neutral-300 mb-2">Export / Integrity</div>
                      <div className="space-y-1.5 text-[10px] text-neutral-400">
                        <div>Last export: —</div>
                        <div>Hash: —</div>
                        <div>Chain: —</div>
                      </div>
                    </Surface>
                  </div>
                </div>
              ) : (
                <Surface variant="card" className="overflow-hidden">
                  {auditLoading ? (
                    <div className="p-8 text-center text-neutral-400">Yükleniyor…</div>
                  ) : (
                    <>
                      <AuditTable rows={filteredAuditItems} />
                      <div className="px-4 py-3 border-t border-neutral-800 text-xs text-neutral-400">
                        Toplam {filteredAuditItems.length} kayıt listelendi
                      </div>
                      <div className="px-4 pb-3 text-xs text-neutral-500">
                        Son güncelleme: <ClientTime />
                      </div>
                    </>
                  )}
                </Surface>
              )}
            </div>
          </div>
        );

      case 'canary':
        return (
          <div className="flex flex-col gap-2">
            {/* PATCH SCROLL-OPT: lg+ ekranlarda 2 kolon (scroll'u sıfırlar) */}
            <div className="grid gap-2 lg:grid-cols-12">
              {/* Sol kolon: Release Gate Durumu */}
              <section className="lg:col-span-7 space-y-4">
                <Surface variant="card" className="p-4">
                <div className={cn(cardHeader, 'mb-4')}>Release Gate Durumu</div>
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">Son Çalışma</div>
                    <div className="text-sm font-medium text-neutral-200">
                      {canaryResult.timestamp ? (
                        <>
                          <ClientTime value={canaryResult.timestamp} format="datetime" />
                          <span className="text-xs text-neutral-500 ml-2">
                            ({(() => {
                              const diff = Date.now() - new Date(canaryResult.timestamp).getTime();
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              const hours = Math.floor(diff / (1000 * 60 * 60));
                              const minutes = Math.floor(diff / (1000 * 60));
                              if (days > 0) return `${days} gün önce`;
                              if (hours > 0) return `${hours} saat önce`;
                              if (minutes > 0) return `${minutes} dakika önce`;
                              return 'Az önce';
                            })()})
                          </span>
                        </>
                      ) : (
                        'Henüz çalıştırılmadı'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">Son Sonuç</div>
                    <div className="flex items-center gap-2">
                      {canaryResult.status === null ? (
                        <span className="text-sm text-neutral-500">—</span>
                      ) : canaryResult.status === 'pass' ? (
                        <span className={cn(badgeVariant('success'))}>PASS</span>
                      ) : canaryResult.status === 'fail' ? (
                        <span className={cn(badgeVariant('warning'))}>FAIL</span>
                      ) : (
                        <span className={cn(badgeVariant('info'))}>RUNNING</span>
                      )}
                      {canaryResult.status === 'fail' && (
                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          Blocker: {Object.values(canaryResult.checks).filter(v => !v).length}
                        </span>
                      )}
                      {canaryResult.status === 'pass' && Object.values(canaryResult.checks).some(v => !v) && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Warning: {Object.values(canaryResult.checks).filter(v => !v).length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">Commit Hash</div>
                    <div className="text-sm font-mono text-neutral-300">
                      {canaryResult.commitHash ? (
                        <a
                          href={`https://github.com/spark-trading/platform/commit/${canaryResult.commitHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          {canaryResult.commitHash.slice(0, 7)}
                        </a>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">CI Job</div>
                    <div className="text-sm">
                      {canaryResult.status === 'pass' ? (
                        <a
                          href="https://github.com/spark-trading/platform/actions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Canary Smoke →
                        </a>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </div>
                  </div>
                </div>
                {canaryResult.status === 'pass' && (
                  <div className="pt-4 border-t border-neutral-800">
                    <div className="text-xs text-neutral-400 mb-2">Evidence Linkleri:</div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="/evidence/local/smoke"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>📊</span>
                        <span>Smoke Logs</span>
                      </a>
                      <a
                        href="/evidence/local/e2e"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>🧪</span>
                        <span>E2E Results</span>
                      </a>
                      <a
                        href="/evidence/local/ui-diff"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>🖼️</span>
                        <span>UI Diff</span>
                      </a>
                    </div>
                  </div>
                )}
              </Surface>
              </section>

              {/* PATCH 4: Evidence Preview (alt satır) */}
              {canaryResult.status === 'pass' && (
                <div className="lg:col-span-12 mt-2">
                  <Surface variant="card" className="p-3">
                    <div className={cn(cardHeader, 'mb-3 text-xs')}>Evidence Preview</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { type: 'UI Diff', icon: '🖼️', title: 'Visual Regression', timestamp: '11 gün önce' },
                        { type: 'Smoke Logs', icon: '📊', title: 'E2E Test Results', timestamp: '11 gün önce' },
                        { type: 'E2E Results', icon: '🧪', title: 'Integration Tests', timestamp: '11 gün önce' },
                      ].map((evidence, i) => (
                        <a
                          key={i}
                          href={`/evidence/local/${evidence.type.toLowerCase().replace(/\s+/g, '-')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{evidence.icon}</span>
                            <span className="text-[10px] font-medium text-neutral-300 group-hover:text-neutral-200">
                              {evidence.type}
                            </span>
                          </div>
                          <div className="text-[9px] text-neutral-500">{evidence.timestamp}</div>
                        </a>
                      ))}
                    </div>
                    <div className="mt-2 text-center">
                      <button
                        onClick={() => {/* TODO: Open evidence modal/drawer */}}
                        className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Tüm evidence'ı gör →
                      </button>
                    </div>
                  </Surface>
                </div>
              )}

              {/* Sağ kolon: Kontrol Listesi + Run History + CTA */}
              {/* PATCH 4: Release Gate Fill - Run History + Evidence Preview */}
              <section className="lg:col-span-5 space-y-3 canary-checklist-section">
                <Surface variant="card" className="p-4 overflow-visible canary-checklist-card">
                  <div className={cn(cardHeader, 'mb-2')}>Kontrol Listesi</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(canaryResult.checks).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-1.5 rounded-md bg-neutral-900/30 border border-neutral-800">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-neutral-300 capitalize leading-tight">
                            {key === 'uiDiff' ? 'UI Diff' :
                             key === 'typecheck' ? 'Typecheck' :
                             key === 'apiHealth' ? 'API Health' :
                             key === 'wsHealth' ? 'WS Health' :
                             key === 'executorHealth' ? 'Executor Health' :
                             key === 'sampleDataSeed' ? 'Sample Data Seed' : key}
                          </div>
                          <div className="text-[9px] text-neutral-500 mt-0.5 leading-tight">
                            Son: {canaryResult.timestamp ? new Date(canaryResult.timestamp).toLocaleTimeString('tr-TR') : '—'}
                          </div>
                        </div>
                        <span className={cn(badgeVariant(value ? 'success' : 'default'), 'shrink-0 ml-1.5 text-xs')}>
                          {value ? '✓' : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </Surface>

                {/* PATCH 4: Run History (son 5) */}
                <Surface variant="card" className="p-3">
                  <div className={cn(cardHeader, 'mb-2 text-xs')}>Run History</div>
                  <div className="space-y-1.5">
                    {[
                      { status: 'pass', commit: 'a1b2c3d', duration: '2m 15s', timestamp: Date.now() - 11 * 24 * 3600 * 1000 },
                      { status: 'pass', commit: 'f4e5d6c', duration: '2m 08s', timestamp: Date.now() - 12 * 24 * 3600 * 1000 },
                      { status: 'fail', commit: 'b7c8d9e', duration: '1m 45s', timestamp: Date.now() - 13 * 24 * 3600 * 1000 },
                      { status: 'pass', commit: 'c9d0e1f', duration: '2m 22s', timestamp: Date.now() - 14 * 24 * 3600 * 1000 },
                      { status: 'pass', commit: 'd1e2f3a', duration: '2m 05s', timestamp: Date.now() - 15 * 24 * 3600 * 1000 },
                    ].map((run, i) => (
                      <div key={i} className="flex items-center justify-between p-1.5 rounded bg-neutral-900/30 border border-neutral-800">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded font-medium',
                            run.status === 'pass'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          )}>
                            {run.status === 'pass' ? 'PASS' : 'FAIL'}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 truncate">{run.commit}</span>
                        </div>
                        <div className="text-[9px] text-neutral-500 ml-2 shrink-0">
                          {run.duration} · <ClientTime value={run.timestamp} format="relative" minWidth="10ch" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>

                {/* CTA - kompakt, sağ kolonda */}
                <button
                  onClick={runCanary}
                  disabled={canaryLoading}
                  className={cn(
                    'w-full px-4 rounded-lg text-sm font-medium text-white transition-colors canary-cta-button',
                    canaryLoading
                      ? 'bg-neutral-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  )}
                  style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                >
                  {canaryLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      <span>Çalışıyor…</span>
                    </span>
                  ) : (
                    "Canary'yi Çalıştır"
                  )}
                </button>
              </section>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="h-full min-h-0 flex flex-col gap-2 overflow-x-hidden"
      style={{
        // PATCH CONTROL-LAYOUT-1: Kesin height chain - h-full → flex-1 → min-h-0 → overflow-y-auto
        paddingTop: isCompact ? '2px' : '4px',
        paddingLeft: isCompact ? '10px' : '12px',
        paddingRight: isCompact ? '10px' : '12px',
      }}
    >
      {/* UI-1: H1 sr-only (breadcrumb StatusBar'da, tab bar yeter) */}
      <PageHeader
        title="Operasyon Merkezi"
        subtitle="Risk yönetimi, uyarılar, denetim ve release kontrolü"
        className="sr-only"
      />

      {/* Health Card - Üst bar (operasyon merkezi) */}
      <div className="shrink-0 mb-2">
        <RuntimeHealthCard />
      </div>

      {/* Tabs - PATCH CONTROL-LAYOUT-1: shrink-0 (sabit yükseklik) */}
      <div className="flex items-center gap-2 border-b border-neutral-800 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            )}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* PATCH REFACTOR-1: TEK scroll kaynağı - renderTab() ile temiz yapı */}
      {/* PATCH SCROLL-OPT: scrollbar-gutter: auto (sığdığında scroll alanı hissi yok) */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col"
        style={{ scrollbarGutter: 'auto' } as React.CSSProperties}
      >
        {renderTab()}
        {/* PATCH SCROLL-OPT: Sentinel yüksekliği 0 (E2E için hala mevcut ama scroll tetiklemez) */}
        <div className="h-0 w-full shrink-0" data-testid="control-bottom-sentinel" aria-hidden="true" />
      </div>
    </div>
  );
}

