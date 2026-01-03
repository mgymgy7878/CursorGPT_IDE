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
import { Tooltip } from '@/components/ui/Tooltip';
import { cardHeader, badgeVariant } from '@/styles/uiTokens';
import { cn } from '@/lib/utils';
import { ClientTime } from '@/components/common/ClientTime';
import { uiCopy } from '@/lib/uiCopy';
import { formatCurrency, formatPercent } from '@/lib/format';
import { useDensityMode } from '@/hooks/useDensityMode';

// UI-1: Collapsible Risk Parameters component (varsayılan kapalı) + ops-safe form
function CollapsibleRiskParams({ isCompact }: { isCompact: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [values, setValues] = useState({
    maxDrawdown: '5.0',
    maxLeverage: '20',
    maxPositionSize: '10000',
    allowedMarkets: 'all',
  });
  // PATCH P0: Type alias for useState generic (TSX parser fix)
  type FieldErrors = Record<string, string>;
  const [errors, setErrors] = useState<FieldErrors>({});

  return (
    <Surface variant="card" className="p-3 overflow-visible">
      {/* PATCH CONTROL-OPT-1: Özet şeridi + Düzenle butonu */}
      <div className={cn("flex items-center justify-between", isCompact ? "mb-2" : "mb-2.5")}>
        <div className="flex-1">
          <div className={cn(cardHeader, "mb-1 text-sm leading-tight")}>
            Risk Parametreleri
          </div>
          {/* Özet şeridi */}
          <div className={cn(
            "flex items-center gap-3 text-neutral-400",
            isCompact ? "text-[10px]" : "text-[11px]"
          )}>
            <span>Exposure limit: <span className="text-neutral-300 font-medium">50%</span></span>
            <span>•</span>
            <span>Max DD: <span className="text-neutral-300 font-medium">{values.maxDrawdown}%</span></span>
            <span>•</span>
            <span>Günlük zarar: <span className="text-neutral-300 font-medium">${parseInt(values.maxPositionSize).toLocaleString()}</span></span>
            {hasUnsavedChanges && (
              <>
                <span>•</span>
                <span className="text-amber-400 font-medium">Unsaved</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "rounded-lg font-medium text-white transition-colors shrink-0",
            isCompact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
            isOpen
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-neutral-700 hover:bg-neutral-600"
          )}
        >
          {isOpen ? 'Kaydet' : 'Düzenle'}
        </button>
      </div>
      {isOpen && (
        <>
          <div className="mt-3 space-y-4 pb-4 overflow-visible">
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
          </div>
          {/* PATCH CONTROL-OPT-1: Sticky Save/Cancel bar (dirty-state ile) */}
          {hasUnsavedChanges && (
            <div className="sticky bottom-0 -mx-3 -mb-3 px-3 py-2.5 bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-800 flex items-center justify-end gap-2">
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
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  setHasUnsavedChanges(false);
                  // TODO: API call to save
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Kaydet
              </button>
            </div>
          )}
        </>
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
  // PATCH A: Alerts expand/collapse
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  // PATCH W: Kill Switch arm/hold-to-confirm
  const [killSwitchArmed, setKillSwitchArmed] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);
  const holdDuration = 2000; // 2 seconds
  // PATCH W.1: Armed durumu + süre penceresi (30s otomatik disarm)
  const [armedAt, setArmedAt] = useState<number | null>(null);
  const armedTimeout = 30000; // 30 seconds

  // PATCH F: Adaptive compact mode - density + viewport height
  const [density] = useDensityMode();
  const [isViewportShort, setIsViewportShort] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      // 768p + browser UI + zoom (110-125%) = ~680-720px available height
      // Risk: viewport height < 720px ise compact mode
      setIsViewportShort(window.innerHeight < 720);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const isCompact = density === 'compact' || density === 'ultra' || isViewportShort;

  // PATCH W: Arm toggle
  const handleArmToggle = () => {
    if (killSwitchArmed) {
      setKillSwitchArmed(false);
      setHoldStartTime(null);
      setArmedAt(null);
    } else {
      setKillSwitchArmed(true);
      setArmedAt(Date.now());
    }
  };

  // PATCH W.1: Otomatik disarm (30s sonra)
  useEffect(() => {
    if (!killSwitchArmed || !armedAt) return;

    const timer = setTimeout(() => {
      setKillSwitchArmed(false);
      setArmedAt(null);
      setHoldStartTime(null);
    }, armedTimeout);

    return () => clearTimeout(timer);
  }, [killSwitchArmed, armedAt]);

  // PATCH W.1: Armed süre hesaplama (badge için)
  const armedTimeRemaining = armedAt ? Math.max(0, Math.ceil((armedTimeout - (Date.now() - armedAt)) / 1000)) : 0;

  // PATCH W: Hold-to-confirm handlers
  const handleHoldStart = () => {
    if (!killSwitchArmed) return;
    setHoldStartTime(Date.now());
  };

  const handleHoldEnd = () => {
    if (!killSwitchArmed || !holdStartTime) return;
    const elapsed = Date.now() - holdStartTime;
    if (elapsed >= holdDuration) {
      // Hold duration met - trigger kill switch
      confirmKillSwitch();
    }
    setHoldStartTime(null);
  };

  const handleKillSwitchToggle = () => {
    if (!killSwitchActive) {
      // Activating kill switch - arm required first
      if (!killSwitchArmed) {
        // Show arm prompt
        return;
      }
      // If armed, show confirmation modal
      setShowKillSwitchConfirm(true);
    } else {
      // Deactivating - direct action
      setKillSwitchActive(false);
      setKillSwitchTriggeredBy(null);
      setKillSwitchArmed(false);
      setHoldStartTime(null);
    }
  };

  const confirmKillSwitch = () => {
    setKillSwitchActive(true);
    setKillSwitchTriggeredBy('UI');
    setKillSwitchLastTriggered(new Date().toLocaleString('tr-TR'));
    setShowKillSwitchConfirm(false);
    setKillSwitchArmed(false);
    setHoldStartTime(null);

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

  // PATCH W: Hold progress calculation
  const holdProgress = holdStartTime
    ? Math.min(100, ((Date.now() - holdStartTime) / holdDuration) * 100)
    : 0;

  // PATCH W.1: Hold progress için animasyon (smooth update)
  const [animatedHoldProgress, setAnimatedHoldProgress] = useState(0);

  useEffect(() => {
    if (!holdStartTime) {
      setAnimatedHoldProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const progress = Math.min(100, ((Date.now() - holdStartTime) / holdDuration) * 100);
      setAnimatedHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [holdStartTime]);

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
          title: 'Yüksek Maruziyet Tespit Edildi',
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

  // PATCH A: Above-the-fold fit - overflow-hidden, sıkı spacing
  // PATCH F: Adaptive spacing based on compact mode
  // PATCH G/H: Root gap yumuşatıldı (yukarı fazla çekilmiş hissini düzelt)
  // PATCH I: min-h-0 zinciri + son kartların taşmasını engelle
  // PATCH J: Üst boşluk recapture - gap ve padding azaltıldı
  // PATCH CONTROL-LAYOUT-1: Scroll host'ta olacağı için içeride overflow yönetme
  const rootGap = isCompact ? 'gap-2' : 'gap-2.5';
  const cardPadding = isCompact ? 'p-2.5' : 'p-3';
  // PATCH G/H: Alerts max-height düzeltildi - collapsed en az 110px, expanded 200px/240px
  const alertsMaxH = isCompact ? (alertsExpanded ? 'max-h-[200px]' : 'max-h-[110px]') : (alertsExpanded ? 'max-h-[240px]' : 'max-h-[110px]');

  return (
    <div className={cn("flex flex-col", rootGap)}>
      {/* Risk Level Indicator - PATCH CONTROL-OPT-3: Kompakt chip özetli komuta satırı */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5">
        {/* Sol: Risk durumu pill */}
        <div className="flex items-center gap-2">
          <span className={cn("text-amber-400", isCompact ? "text-xs" : "text-sm")}>▲</span>
          <span className={cn("font-semibold text-amber-400", isCompact ? "text-xs" : "text-sm")}>Risk: Orta</span>
        </div>
        {/* Orta: Kısa özet chips */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <span className={cn("text-neutral-400", isCompact ? "text-[9px]" : "text-[10px]")}>
            Exposure {metrics.currentExposure}/{metrics.exposureLimit}
          </span>
          <span className="text-neutral-600">•</span>
          <span className={cn("text-neutral-400", isCompact ? "text-[9px]" : "text-[10px]")}>
            DD {formatPercent(metrics.maxDD24h)}/{metrics.maxDDLimit}%
          </span>
          <span className="text-neutral-600">•</span>
          <span className={cn("text-neutral-400", isCompact ? "text-[9px]" : "text-[10px]")}>
            Daily {formatCurrency(metrics.dailyLoss, 'USD')}/{formatCurrency(metrics.dailyLossLimit, 'USD')}
          </span>
          <span className="text-neutral-600">•</span>
          <span className={cn("text-neutral-400", isCompact ? "text-[9px]" : "text-[10px]")}>
            Open {metrics.openOrders}/{metrics.openOrdersLimit}
          </span>
        </div>
        {/* Sağ: Son güncelleme + heartbeat */}
        <div className="flex items-center gap-1.5">
          <span className={cn("text-neutral-500", isCompact ? "text-[9px]" : "text-[10px]")}>
            Son: <ClientTime value={Date.now() - 12000} format="relative" />
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Key Metrics - PATCH A: Sıkı spacing, PATCH F: Adaptive gap */}
      <div className={cn("grid grid-cols-2 md:grid-cols-4", isCompact ? "gap-1.5" : "gap-2")}>
        {/* PATCH O: Türkçeleştirme */}
        <StatCard
          label="Mevcut Maruziyet"
          value={`${metrics.currentExposure}%`}
          sublabel={`Limit: ${metrics.exposureLimit}%`}
        />
        <StatCard
          label="Max DD (24h)"
          value={formatPercent(metrics.maxDD24h)}
          sublabel={`Limit: ${metrics.maxDDLimit}%`}
        />
        <StatCard
          label="Günlük Zarar"
          value={formatCurrency(metrics.dailyLoss, 'USD')}
          sublabel={`Limit: ${formatCurrency(metrics.dailyLossLimit, 'USD')}`}
        />
        <StatCard
          label="Açık Emirler"
          value={metrics.openOrders}
          sublabel={`Limit: ${metrics.openOrdersLimit}`}
        />
      </div>

      {/* Global Kill Switch - PATCH CONTROL-OPT-1: Kompakt 2 satır layout */}
      <Surface variant="card" className={cn(cardPadding, "border-red-500/30 bg-red-500/5")}>
        {/* Satır 1: Durum + Arm Butonu */}
        <div className={cn("flex items-center justify-between", isCompact ? "mb-2" : "mb-2.5")}>
          <div className="flex items-center gap-2">
            <span className={isCompact ? "text-base" : "text-lg"}>⚡</span>
            <div>
              <div className={cn("font-semibold text-neutral-200 leading-tight", isCompact ? "text-xs" : "text-sm")}>
                Global Kill Switch
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn(
                  killSwitchActive ? 'text-red-400' : killSwitchArmed ? 'text-amber-400' : 'text-emerald-400',
                  "leading-tight font-medium",
                  isCompact ? "text-[10px]" : "text-[11px]"
                )}>
                  {killSwitchActive ? 'Sistem Engellendi' : killSwitchArmed ? uiCopy.killSwitch.armed : uiCopy.killSwitch.systemNormal}
                </div>
                {killSwitchArmed && armedTimeRemaining > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-semibold",
                    "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  )}>
                    {armedTimeRemaining}s
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleArmToggle}
            className={cn(
              "rounded-lg font-medium text-white transition-colors shrink-0",
              isCompact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
              killSwitchArmed
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-neutral-700 hover:bg-neutral-600"
            )}
          >
            {killSwitchArmed ? 'Disarm' : uiCopy.killSwitch.arm}
          </button>
        </div>

        {/* Satır 2: Toggles + Acil Durdur */}
        <div className="flex items-center justify-between gap-3">
          <div className={cn("flex items-center gap-3 flex-1", isCompact ? "text-[11px]" : "text-[12px]")}>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={killSwitchOptions.closeAllPositions}
                onChange={(e) => setKillSwitchOptions({ ...killSwitchOptions, closeAllPositions: e.target.checked })}
                className={cn("rounded border-neutral-600", isCompact ? "w-3.5 h-3.5" : "w-4 h-4")}
              />
              <span className="text-neutral-300 leading-tight">Pozisyonları Kapat</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={killSwitchOptions.blockNewOrders}
                onChange={(e) => setKillSwitchOptions({ ...killSwitchOptions, blockNewOrders: e.target.checked })}
                className={cn("rounded border-neutral-600", isCompact ? "w-3.5 h-3.5" : "w-4 h-4")}
              />
              <span className="text-neutral-300 leading-tight">Yeni Emirleri Engelle</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={killSwitchOptions.stopStrategies}
                onChange={(e) => setKillSwitchOptions({ ...killSwitchOptions, stopStrategies: e.target.checked })}
                className={cn("rounded border-neutral-600", isCompact ? "w-3.5 h-3.5" : "w-4 h-4")}
              />
              <span className="text-neutral-300 leading-tight">Stratejileri Durdur</span>
            </label>
          </div>
          {/* Acil Durdur - PATCH CONTROL-OPT-1: Sağda tek CTA */}
          {!killSwitchArmed && !killSwitchActive ? (
            <Tooltip content={uiCopy.killSwitch.armFirst} side="top">
              <button
                disabled={true}
                className={cn(
                  "rounded-lg font-semibold text-white transition-all relative overflow-hidden shrink-0",
                  isCompact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-xs",
                  "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                )}
              >
                {uiCopy.killSwitch.emergencyStop}
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => {
                // PATCH CONTROL-OPT-3: 2-adımlı onay modal'ı aç (arm kontrolü handleKillSwitchToggle içinde)
                handleKillSwitchToggle();
              }}
              disabled={killSwitchActive}
              className={cn(
                "rounded-lg font-semibold text-white transition-all relative overflow-hidden shrink-0",
                isCompact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-xs",
                killSwitchActive
                  ? "bg-neutral-700 hover:bg-neutral-600"
                  : "bg-red-600 hover:bg-red-700 active:bg-red-800"
              )}
            >
              {killSwitchActive ? 'SİSTEMİ AÇ' : uiCopy.killSwitch.emergencyStop}
            </button>
          )}
        </div>
        {killSwitchLastTriggered && (
          <div className={cn("border-t border-neutral-800 mt-3 pt-3", isCompact ? "mt-2 pt-2" : "mt-3 pt-3")}>
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
      </Surface>

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

      {/* Aktif Risk Uyarıları - PATCH CONTROL-OPT-1: Top 3 + Tümünü gör */}
      <Surface variant="card" className={cn(cardPadding, "overflow-visible flex flex-col")}>
        <div className={cn("flex items-center justify-between shrink-0", isCompact ? "mb-2" : "mb-2.5")}>
          <div>
            <div className={cn(cardHeader, "mb-0 leading-tight", isCompact ? "text-xs" : "text-sm")}>
              Aktif Risk Uyarıları
            </div>
            <div className={cn("text-neutral-500 mt-0.5 leading-tight", isCompact ? "text-[9px]" : "text-[10px]")}>
              Real-time monitoring
            </div>
          </div>
          {groupedAlerts.length > 3 && (
            <button
              onClick={() => setAlertsExpanded(!alertsExpanded)}
              className={cn(
                "font-medium text-blue-400 hover:text-blue-300 rounded border border-blue-500/30 hover:bg-blue-500/10 transition-colors",
                isCompact ? "text-[10px] px-2 py-1" : "text-xs px-2.5 py-1.5"
              )}
            >
              {alertsExpanded ? '▼ Gizle' : `Tümünü gör (${groupedAlerts.length})`}
            </button>
          )}
        </div>
        <div className={cn(
          "space-y-2",
          isCompact ? "space-y-1.5" : "space-y-2"
        )}>
          {(alertsExpanded ? groupedAlerts : groupedAlerts.slice(0, 3)).map((group) => (
            <div
              key={group.key}
              className={cn(
                "rounded-lg border border-red-500/20 transition-colors",
                isCompact ? "p-1.5" : "p-2",
                "bg-red-500/10 hover:bg-red-500/15"
              )}
            >
              {/* PATCH CONTROL-OPT-3: Kompakt tek satır layout */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className={cn("font-medium text-red-300", isCompact ? "text-[10px]" : "text-xs")}>
                      {group.title}
                    </div>
                    {group.count > 1 && (
                      <span className={cn(
                        "font-medium text-red-400 bg-red-500/20 px-1 py-0.5 rounded",
                        isCompact ? "text-[8px]" : "text-[9px]"
                      )}>
                        (x{group.count})
                      </span>
                    )}
                    <span className={cn("text-neutral-500", isCompact ? "text-[8px]" : "text-[9px]")}>
                      · {group.lastTriggered}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {/* TODO: Acknowledge */}}
                    className={cn(
                      "font-medium text-neutral-300 hover:text-white bg-neutral-800/50 hover:bg-neutral-700 rounded border border-neutral-700 transition-colors",
                      isCompact ? "px-1 py-0.5 text-[8px]" : "px-1 py-0.5 text-[9px]"
                    )}
                    title="Onayla"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {/* TODO: Snooze 10m */}}
                    className={cn(
                      "font-medium text-neutral-300 hover:text-white bg-neutral-800/50 hover:bg-neutral-700 rounded border border-neutral-700 transition-colors",
                      isCompact ? "px-1 py-0.5 text-[8px]" : "px-1 py-0.5 text-[9px]"
                    )}
                    title="10 dk ertele"
                  >
                    ⏰
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Surface>

      {/* Risk Parametreleri - PATCH I: Padding yumuşatıldı, isCompact prop */}
      <div className={isCompact ? "[&>*]:p-2.5" : "[&>*]:p-3"}>
        <CollapsibleRiskParams isCompact={isCompact} />
      </div>
    </div>
  );
}

