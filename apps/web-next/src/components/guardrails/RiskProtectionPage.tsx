/**
 * RiskProtectionPage - Figma Parity Risk & Protection Page
 *
 * Figma tasarımına göre:
 * - Risk Level göstergesi
 * - Metrikler (Current Exposure, Max DD, Daily Loss, Open Orders)
 * - Global Kill Switch
 * - Aktif Risk Uyarıları
 * - Risk Parametreleri
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { StatCard } from '@/components/ui/StatCard';
import { cardHeader, badgeVariant } from '@/styles/uiTokens';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent } from '@/lib/format';

// UI-1: Collapsible Risk Parameters component (varsayılan kapalı) + ops-safe form
function CollapsibleRiskParams() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [values, setValues] = useState({
    maxDrawdown: '5.0',
    maxLeverage: '20',
    maxPositionSize: '10000',
    allowedMarkets: 'all',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <Surface variant="card" className="p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-0 text-left"
      >
        <div className="flex items-center gap-2">
          <div className={cn(cardHeader, "mb-0")}>
            Risk Parametreleri
          </div>
          {hasUnsavedChanges && (
            <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              Unsaved
            </span>
          )}
        </div>
        <span className="text-neutral-400 text-sm">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Max Daily Drawdown (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={values.maxDrawdown}
                onChange={(e) => {
                  const val = e.target.value;
                  setValues({ ...values, maxDrawdown: val });
                  setHasUnsavedChanges(true);
                  if (val && (parseFloat(val) < 0 || parseFloat(val) > 100)) {
                    setErrors({ ...errors, maxDrawdown: '0-100 arası olmalı' });
                  } else {
                    const { maxDrawdown, ...rest } = errors;
                    setErrors(rest);
                  }
                }}
                className={cn(
                  "w-full px-3 py-2 rounded-lg bg-neutral-800 border text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.maxDrawdown ? "border-red-500/50" : "border-neutral-700"
                )}
              />
              {errors.maxDrawdown && (
                <div className="text-[10px] text-red-400 mt-1">{errors.maxDrawdown}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Max Leverage
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={values.maxLeverage}
                onChange={(e) => {
                  const val = e.target.value;
                  setValues({ ...values, maxLeverage: val });
                  setHasUnsavedChanges(true);
                  if (val && (parseInt(val) < 1 || parseInt(val) > 100)) {
                    setErrors({ ...errors, maxLeverage: '1-100 arası olmalı' });
                  } else {
                    const { maxLeverage, ...rest } = errors;
                    setErrors(rest);
                  }
                }}
                className={cn(
                  "w-full px-3 py-2 rounded-lg bg-neutral-800 border text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.maxLeverage ? "border-red-500/50" : "border-neutral-700"
                )}
              />
              {errors.maxLeverage && (
                <div className="text-[10px] text-red-400 mt-1">{errors.maxLeverage}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Max Position Size (USDT)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={values.maxPositionSize}
                onChange={(e) => {
                  setValues({ ...values, maxPositionSize: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Allowed Markets
              </label>
              <select
                value={values.allowedMarkets}
                onChange={(e) => {
                  setValues({ ...values, allowedMarkets: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Markets</option>
                <option value="crypto">Crypto Only</option>
                <option value="stocks">Stocks Only</option>
              </select>
            </div>
          </div>
          {/* UI-1: Ops-safe form - Save button */}
          {hasUnsavedChanges && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => {
                  setHasUnsavedChanges(false);
                  // TODO: API call to save
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Kaydet
              </button>
              <button
                onClick={() => {
                  setValues({
                    maxDrawdown: '5.0',
                    maxLeverage: '20',
                    maxPositionSize: '10000',
                    allowedMarkets: 'all',
                  });
                  setHasUnsavedChanges(false);
                  setErrors({});
                }}
                className="px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
              >
                İptal
              </button>
            </div>
          )}
        </div>
      )}
    </Surface>
  );
}

interface RiskMetrics {
  currentExposure: number;
  maxDD24h: number;
  dailyLoss: number;
  openOrders: number;
  exposureLimit: number;
  maxDDLimit: number;
  dailyLossLimit: number;
  openOrdersLimit: number;
}

interface RiskAlert {
  id: string;
  message: string;
  timestamp: string;
}

export default function RiskProtectionPage() {
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [showKillSwitchConfirm, setShowKillSwitchConfirm] = useState(false);
  const [killSwitchTriggeredBy, setKillSwitchTriggeredBy] = useState<'UI' | 'AI' | 'System' | null>(null);
  const [killSwitchLastTriggered, setKillSwitchLastTriggered] = useState<string | null>(null);
  const [killSwitchOptions, setKillSwitchOptions] = useState({
    closeAllPositions: false,
    stopStrategies: true,
    blockNewOrders: true,
  });

  const handleKillSwitchToggle = () => {
    if (!killSwitchActive) {
      // Activating kill switch - show confirmation
      setShowKillSwitchConfirm(true);
    } else {
      // Deactivating - direct action
      setKillSwitchActive(false);
      setKillSwitchTriggeredBy(null);
    }
  };

  const confirmKillSwitch = () => {
    setKillSwitchActive(true);
    setKillSwitchTriggeredBy('UI');
    setKillSwitchLastTriggered(new Date().toLocaleString('tr-TR'));
    setShowKillSwitchConfirm(false);

    // TODO: API call to trigger kill switch
    fetch('/api/guardrails/kill-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        active: true,
        options: killSwitchOptions,
        triggeredBy: 'UI',
      }),
    }).catch(() => {});
  };

  // Mock metrics
  const metrics: RiskMetrics = {
    currentExposure: 42,
    maxDD24h: -1.2,
    dailyLoss: 1240,
    openOrders: 8,
    exposureLimit: 50,
    maxDDLimit: 5,
    dailyLossLimit: 5000,
    openOrdersLimit: 20,
  };

  // Mock alerts
  const rawAlerts: RiskAlert[] = [
    { id: '1', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
    { id: '2', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
    { id: '3', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
    { id: '4', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
    { id: '5', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
  ];

  // UI-1: Alert grouping - aynı type + market + rule için gruplama
  type GroupedAlert = {
    key: string;
    title: string;
    message: string;
    count: number;
    lastTriggered: string;
    trend: string;
    alerts: RiskAlert[];
  };

  const groupedAlerts = useMemo(() => {
    const groups = new Map<string, GroupedAlert>();

    rawAlerts.forEach((alert) => {
      // Gruplama key'i: message içeriğine göre (gerçek uygulamada type+market+rule)
      const key = alert.message;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          title: 'High Exposure Detected',
          message: alert.message,
          count: 0,
          lastTriggered: alert.timestamp,
          trend: 'Son 10 dk: 5 tetiklenme',
          alerts: [],
        });
      }

      const group = groups.get(key)!;
      group.count++;
      group.alerts.push(alert);
      // En son tetiklenme zamanını güncelle
      if (alert.timestamp < group.lastTriggered) {
        group.lastTriggered = alert.timestamp;
      }
    });

    return Array.from(groups.values());
  }, [rawAlerts]);

  return (
    <div className="space-y-3">
      {/* Risk Level Indicator - UI-1: Compact density - mb-3, padding küçültüldü */}
      <div
        className="mb-3 border-amber-500/30 bg-amber-500/5 rounded-lg"
        style={{
          padding: 'var(--card-pad, 12px)',
          borderRadius: 'var(--card-radius, 12px)',
          borderWidth: 'var(--card-border-w, 1px)',
        }}
      >
        <div className="flex items-center gap-2 py-2">
          <span className="text-lg">▲</span>
          <div>
            <div className="text-xs text-neutral-400 mb-0.5">Risk Level</div>
            <div className="text-base font-semibold text-amber-400">Medium</div>
          </div>
        </div>
      </div>

      {/* Key Metrics - UI-1: Compact density - mb-3, gap-3 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <StatCard
          label="Current Exposure"
          value={`${metrics.currentExposure}%`}
          sublabel={`Limit: ${metrics.exposureLimit}%`}
        />
        <StatCard
          label="Max DD (24h)"
          value={formatPercent(metrics.maxDD24h)}
          sublabel={`Limit: ${metrics.maxDDLimit}%`}
        />
        <StatCard
          label="Daily Loss"
          value={formatCurrency(metrics.dailyLoss, 'USD')}
          sublabel={`Limit: ${formatCurrency(metrics.dailyLossLimit, 'USD')}`}
        />
        <StatCard
          label="Open Orders"
          value={metrics.openOrders}
          sublabel={`Limit: ${metrics.openOrdersLimit}`}
        />
      </div>

      {/* Global Kill Switch - UI-1: Compact density - mb-3 */}
      <div
        className="mb-3 border-red-500/30 bg-red-500/5 rounded-lg"
        style={{
          padding: 'var(--card-pad, 12px)',
          borderRadius: 'var(--card-radius, 12px)',
          borderWidth: 'var(--card-border-w, 1px)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <div>
              <div className="text-base font-semibold text-neutral-200">Global Kill Switch</div>
              <div className={cn(
                "text-xs",
                killSwitchActive ? 'text-red-400' : 'text-emerald-400'
              )}>
                {killSwitchActive ? 'System Blocked' : 'System Normal'}
              </div>
            </div>
          </div>
          <button
            onClick={handleKillSwitchToggle}
            className={cn(
              "px-4 py-2 text-sm rounded-lg font-semibold text-white transition-colors",
              killSwitchActive
                ? "bg-neutral-700 hover:bg-neutral-600"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {killSwitchActive ? 'SİSTEMİ AÇ' : 'ACİL DURDUR'}
          </button>
        </div>

        {/* PATCH S: Glance'da 2 kolon grid (SSR-safe) */}
        <div className="text-sm glance-kill-switch-grid">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={killSwitchOptions.closeAllPositions}
              onChange={(e) => setKillSwitchOptions({ ...killSwitchOptions, closeAllPositions: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-600"
            />
            <span className="text-neutral-300">Tüm Pozisyonları Kapat</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={killSwitchOptions.stopStrategies}
              onChange={(e) => setKillSwitchOptions({ ...killSwitchOptions, stopStrategies: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-600"
            />
            <span className="text-neutral-300">Stratejileri Durdur</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={killSwitchOptions.blockNewOrders}
              onChange={(e) => setKillSwitchOptions({ ...killSwitchOptions, blockNewOrders: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-600"
            />
            <span className="text-neutral-300">Yeni Emirleri Engelle</span>
          </label>
        </div>
        <div className="mt-3 text-xs text-neutral-500">
          Seçili aksiyonlar acil durdurma tetiklendiğinde sırayla uygulanır.
        </div>
        {killSwitchLastTriggered && (
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <div className="text-xs text-neutral-400">
              Son tetiklenme: {killSwitchLastTriggered}
            </div>
            {killSwitchTriggeredBy && (
              <div className="text-xs text-neutral-500 mt-1">
                Tetikleyen kaynak: {killSwitchTriggeredBy}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kill Switch Confirmation Modal */}
      {showKillSwitchConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-red-500/30 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚡</span>
              <div>
                <div className="text-lg font-semibold text-red-400">Acil Durdurma Onayı</div>
                <div className="text-sm text-neutral-400">Bu işlem geri alınamaz</div>
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <div className="text-sm text-neutral-300 font-medium">Aşağıdaki aksiyonlar uygulanacak:</div>
              <ul className="text-sm text-neutral-400 space-y-1 ml-4 list-disc">
                {killSwitchOptions.blockNewOrders && <li>Yeni emirler engellenecek</li>}
                {killSwitchOptions.stopStrategies && <li>Stratejiler durdurulacak</li>}
                {killSwitchOptions.closeAllPositions && <li>Tüm pozisyonlar kapatılacak</li>}
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowKillSwitchConfirm(false)}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-neutral-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmKillSwitch}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                Onayla ve Tetikle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aktif Risk Uyarıları - UI-1: Gruplama (toplu olay) */}
      <Surface variant="card" className="p-4 mb-3">
        <div className={cn(cardHeader, "mb-3")}>
          Aktif Risk Uyarıları
        </div>
        <div className="text-xs text-neutral-400 mb-3">Real-time monitoring</div>
        <div className="space-y-2">
          {groupedAlerts.map((group) => (
            <div
              key={group.key}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-medium text-red-300">
                      {group.title}
                    </div>
                    {group.count > 1 && (
                      <span className="text-xs font-medium text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">
                        (x{group.count})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 mb-1.5">
                    {group.message}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    {group.trend} · Son: {group.lastTriggered}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {/* TODO: Acknowledge */}}
                    className="px-2 py-1 text-[10px] font-medium text-neutral-300 hover:text-white bg-neutral-800/50 hover:bg-neutral-700 rounded border border-neutral-700 transition-colors"
                    title="Onayla"
                  >
                    ✓ Onayla
                  </button>
                  <button
                    onClick={() => {/* TODO: Snooze 10m */}}
                    className="px-2 py-1 text-[10px] font-medium text-neutral-300 hover:text-white bg-neutral-800/50 hover:bg-neutral-700 rounded border border-neutral-700 transition-colors"
                    title="10 dk ertele"
                  >
                    ⏰ 10m
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Surface>

      {/* Risk Parametreleri - UI-1: Collapsible (varsayılan kapalı) */}
      <CollapsibleRiskParams />
    </div>
  );
}

