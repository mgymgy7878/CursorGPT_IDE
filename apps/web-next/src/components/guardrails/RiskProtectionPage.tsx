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

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { StatCard } from '@/components/ui/StatCard';
import { cardHeader, badgeVariant } from '@/styles/uiTokens';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent } from '@/lib/format';

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
  const alerts: RiskAlert[] = [
    { id: '1', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
    { id: '2', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
    { id: '3', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
    { id: '4', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
    { id: '5', message: 'Total exposure exceeded 80% safe limit on Binance Futures.', timestamp: '12m ago' },
  ];

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

      {/* Aktif Risk Uyarıları */}
      <Surface variant="card" className="p-4 mb-3">
        <div className={cn(cardHeader, "mb-3")}>
          Aktif Risk Uyarıları
        </div>
        <div className="text-xs text-neutral-400 mb-3">Real-time monitoring</div>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-300 mb-1">
                    High Exposure Detected
                  </div>
                  <div className="text-xs text-neutral-400">
                    {alert.message}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 shrink-0">
                  {alert.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Surface>

      {/* Risk Parametreleri */}
      <Surface variant="card" className="p-4">
        <div className={cn(cardHeader, "mb-4")}>
          Risk Parametreleri
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Max Daily Drawdown (%)
            </label>
            <input
              type="number"
              defaultValue="5.0"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Max Leverage
            </label>
            <input
              type="number"
              defaultValue="20"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Max Position Size (USDT)
            </label>
            <input
              type="number"
              defaultValue="10000"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Allowed Markets
            </label>
            <select
              defaultValue="all"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Markets</option>
              <option value="crypto">Crypto Only</option>
              <option value="stocks">Stocks Only</option>
            </select>
          </div>
        </div>
      </Surface>
    </div>
  );
}

