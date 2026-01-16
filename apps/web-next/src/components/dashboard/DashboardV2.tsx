/**
 * Dashboard V2 - Figma parity dashboard with live data
 *
 * Feature flag: SPARK_DASHBOARD_V2
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useDashboardSummary } from '@/lib/dashboard/useDashboardSummary';
import { Skeleton } from '@/components/ui/states';
import { formatMoney, formatPct, formatSymbol } from '@/lib/format';
import { buildSparklinePoints, pushRingBuffer } from '@/lib/dashboard/sparkline';

export default function DashboardV2() {
  const { data, status, error } = useDashboardSummary();
  const sparkBufferRef = useRef<Map<string, number[]>>(new Map());
  const sparkMaxLen = 30;

  useEffect(() => {
    if (!data.market?.symbols) return;
    data.market.symbols.forEach((s) => {
      if (s.price === null || !Number.isFinite(s.price)) return;
      const current = sparkBufferRef.current.get(s.symbol) ?? [];
      const next = pushRingBuffer(current, s.price, sparkMaxLen);
      sparkBufferRef.current.set(s.symbol, next);
    });
  }, [data.market?.symbols]);

  const sparkPointsBySymbol = useMemo(() => {
    const map = new Map<string, string | null>();
    (data.market?.symbols ?? []).forEach((s) => {
      const values = sparkBufferRef.current.get(s.symbol) ?? [];
      map.set(s.symbol, buildSparklinePoints(values));
    });
    return map;
  }, [data.market?.symbols]);

  return (
    <div className="relative px-6 py-4 min-h-screen bg-neutral-950 overflow-hidden" data-page="dashboard-v2">
      {/* Watermark Background - Spark Mark (only show when empty/degraded) */}
      {status === 'loading' || status === 'degraded' ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg
              className="w-[900px] h-[900px] opacity-[0.03]"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M8 2L9.5 5.5L13 6L10.5 8.5L11.5 12L8 10L4.5 12L5.5 8.5L3 6L6.5 5.5L8 2Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </div>
        </div>
      ) : null}

      {/* Header */}
      <div className="mb-6 min-w-0">
        <h1 className="text-2xl font-semibold mb-2 truncate min-w-0">Dashboard V2</h1>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="px-2 py-1 rounded text-xs shrink-0 bg-neutral-800 text-neutral-300">
            V2: ON
          </span>
          <span className={`px-2 py-1 rounded text-xs shrink-0 ${
            status === 'live' ? 'bg-emerald-500/20 text-emerald-300' :
            status === 'degraded' ? 'bg-amber-500/20 text-amber-300' :
            'bg-neutral-800 text-neutral-400'
          }`}>
            {status === 'live' ? 'Live' : status === 'degraded' ? 'Degraded' : 'Loading'}
          </span>
          {data._meta && (
            <>
              <span className="text-xs text-neutral-500 shrink-0">
                {data._meta.fetchTimeMs}ms
              </span>
              {data._meta.sourceHealth && (
                <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                  data._meta.sourceHealth.binance === 'ok' ? 'bg-emerald-500/20 text-emerald-300' :
                  data._meta.sourceHealth.binance === 'timeout' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  Binance: {data._meta.sourceHealth.binance}
                </span>
              )}
            </>
          )}
          {error && (
            <span className="text-xs text-red-400 shrink-0">Error: {error.message}</span>
          )}
          {data._meta?.errors && data._meta.errors.length > 0 && (
            <span className="text-xs text-amber-300 shrink-0">
              Degraded: {data._meta.errors[0]}
            </span>
          )}
        </div>
        {status !== 'live' && (
          <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-xs text-neutral-400">
            {status === 'loading'
              ? 'Veriler yükleniyor…'
              : 'Veri bekleniyor (seed/degraded).'}
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Portfolio Summary Card - Figma Parity: 3 KPIs */}
        <div className="rounded-2xl bg-card/60 p-4">
          <div className="text-sm font-medium mb-3">Portföy Özeti</div>
          {status === 'loading' ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-neutral-500 mb-0.5">Toplam Varlık</div>
                <div className="text-lg font-semibold tabular-nums">
                  {formatMoney(data.portfolio?.totalAsset)}
                </div>
                {data.portfolio && data.portfolio.totalAsset && data.portfolio.totalAsset > 0 && (
                  <div className="text-xs text-emerald-400 mt-0.5">
                    {formatPct(0.024, { showSign: true })} {/* TODO: Get from portfolio history */}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-0.5">Günlük PnL</div>
                <div className={`text-base font-medium tabular-nums ${
                  data.portfolio && data.portfolio.dailyPnL !== null && data.portfolio.dailyPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {data.portfolio && data.portfolio.dailyPnL !== null ? formatMoney(data.portfolio.dailyPnL) : '—'}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">Last 24h</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-0.5">Margin Level</div>
                <div className={`text-base font-medium tabular-nums ${
                  data.portfolio && data.portfolio.marginLevel !== null && data.portfolio.marginLevel >= 100 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {data.portfolio && data.portfolio.marginLevel !== null ? `${data.portfolio.marginLevel}%` : '—'}
                </div>
                {data.portfolio && data.portfolio.marginLevel && data.portfolio.marginLevel >= 100 && (
                  <div className="text-xs text-emerald-400 mt-0.5">Healthy</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Market Status Card - Figma Parity: Single card with list */}
        <div className="rounded-2xl bg-card/60 p-4 relative min-w-0">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="text-sm font-medium truncate min-w-0">Piyasa Durumu</div>
            <div className="flex items-center gap-1.5 shrink-0">
              {data._meta?.dataQuality?.market === 'seed' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  Seed
                </span>
              )}
              {data._meta?.dataQuality?.market === 'live' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Live
                </span>
              )}
              {data._meta?.sourceHealth?.binance && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  data._meta.sourceHealth.binance === 'ok' ? 'bg-emerald-500/20 text-emerald-300' :
                  data._meta.sourceHealth.binance === 'timeout' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {data._meta.sourceHealth.binance}
                </span>
              )}
            </div>
          </div>
          {status === 'loading' ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-2.5">
              {data.market?.symbols && data.market.symbols.length > 0 ? (
                data.market.symbols.map((s) => (
                  <div
                    key={s.symbol}
                    className="flex items-center justify-between gap-2 text-xs min-w-0"
                  >
                    <span className="text-neutral-300 font-medium truncate min-w-0 shrink-0" style={{ minWidth: '80px' }}>
                      {formatSymbol(s.symbol)}
                    </span>
                    <span className="text-neutral-400 tabular-nums shrink-0">
                      {formatMoney(s.price)}
                    </span>
                    <span className="w-10 h-3 shrink-0">
                      {data._meta?.dataQuality?.market === 'live' && s.price !== null ? (
                        <svg viewBox="0 0 40 12" className={`w-10 h-3 ${
                          s.change24h !== null && s.change24h < 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          <polyline
                            points={sparkPointsBySymbol.get(s.symbol) ?? ''}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 40 12" className="w-10 h-3 text-neutral-700">
                          <line x1="0" y1="6" x2="40" y2="6" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                        </svg>
                      )}
                    </span>
                    {s.change24h !== null && (
                      <span className={`tabular-nums shrink-0 font-medium ${
                        s.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatPct(s.change24h)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-neutral-500">Piyasa verisi yükleniyor...</div>
              )}
            </div>
          )}
        </div>

        {/* System Health Card */}
        <div className="rounded-2xl bg-card/60 p-4">
          <div className="text-sm font-medium mb-2">Sistem Sağlığı</div>
          {status === 'loading' ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  data.system.api.ok ? 'bg-emerald-500' : 'bg-red-500'
                }`} />
                <span className="text-neutral-400">API: {data.system.api.ok ? 'OK' : 'DOWN'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  data.system.feed.ok ? 'bg-emerald-500' : 'bg-red-500'
                }`} />
                <span className="text-neutral-400">
                  Feed: {data.system.feed.ok ? 'OK' : 'DOWN'}
                  {data.system.feed.stalenessSec && ` (${data.system.feed.stalenessSec}s)`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  data.system.executor.ok ? 'bg-emerald-500' : 'bg-red-500'
                }`} />
                <span className="text-neutral-400">
                  Executor: {data.system.executor.ok ? 'OK' : 'DOWN'}
                  {data.system.executor.latencyMs !== null && ` (${data.system.executor.latencyMs}ms)`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active Strategies Card - Figma Parity: Count + Top 3 rows */}
        <div className="rounded-2xl bg-card/60 p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="text-sm font-medium truncate min-w-0">Aktif Stratejiler</div>
            <div className="flex items-center gap-1.5 shrink-0">
              {data.strategies && data.strategies.active !== null && data.strategies.active > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {data.strategies.active} Running
                </span>
              )}
              {data.strategies?.dataQuality === 'seed' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  Seed
                </span>
              )}
              {data.strategies?.dataQuality === 'live' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Live
                </span>
              )}
              {data.strategies?.sourceHealth && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  data.strategies.sourceHealth === 'ok' ? 'bg-emerald-500/20 text-emerald-300' :
                  data.strategies.sourceHealth === 'timeout' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {data.strategies.sourceHealth}
                </span>
              )}
            </div>
          </div>
          {status === 'loading' ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-2">
              {data.strategies?.top && data.strategies.top.length > 0 ? (
                data.strategies.top.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 text-xs min-w-0"
                  >
                    <span className="text-neutral-300 font-medium truncate min-w-0 shrink-0" style={{ minWidth: '80px' }}>
                      {s.name}
                    </span>
                    <span className="text-neutral-400 truncate min-w-0 shrink-0">
                      {s.market}
                    </span>
                    {s.pnl24hUsd !== null ? (
                      <span className={`tabular-nums shrink-0 font-medium ${
                        s.pnl24hUsd >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatMoney(s.pnl24hUsd)}
                      </span>
                    ) : (
                      <span className="text-neutral-500 shrink-0">—</span>
                    )}
                  </div>
                ))
              ) : data.strategies && data.strategies.active !== null && data.strategies.active > 0 ? (
                <div className="text-xs text-neutral-500">Henüz strateji verisi yok.</div>
              ) : (
                <div className="text-xs text-neutral-500">Henüz çalışan strateji yok.</div>
              )}
              {data.strategies && data.strategies.totalPnL24h !== null && (
                <div className="text-xs text-neutral-500 mt-2 pt-2 border-t border-neutral-800">
                  24h PnL: <span className={`tabular-nums font-medium ${
                    data.strategies.totalPnL24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatMoney(data.strategies.totalPnL24h)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Risk Status Card - Figma Parity: Bar + Label */}
        <div className="rounded-2xl bg-card/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Risk Durumu</div>
            {data.risk?.level && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                data.risk.level === 'low' ? 'bg-emerald-500/20 text-emerald-300' :
                data.risk.level === 'moderate' ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {data.risk.level === 'low' ? 'Low' : data.risk.level === 'moderate' ? 'Moderate' : 'High'}
              </span>
            )}
          </div>
          {status === 'loading' ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-500">Daily Drawdown</span>
                  <span className="text-neutral-300 tabular-nums font-medium">
                    {data.risk && data.risk.dailyDrawdown !== null ? formatPct(data.risk.dailyDrawdown / 100) : '—'}
                  </span>
                </div>
                {data.risk && data.risk.dailyDrawdown !== null && (
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        data.risk.dailyDrawdown < 1 ? 'bg-emerald-500' :
                        data.risk.dailyDrawdown < 3 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.abs(data.risk.dailyDrawdown) * 10)}%` }}
                    />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-500">Exposure</span>
                  <span className="text-neutral-300 tabular-nums font-medium">
                    {data.risk && data.risk.exposure !== null ? `${data.risk.exposure}%` : '—'}
                  </span>
                </div>
                {data.risk && data.risk.exposure !== null && (
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        data.risk.exposure < 50 ? 'bg-emerald-500' :
                        data.risk.exposure < 80 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, data.risk.exposure)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* AI Decisions Card */}
      <div className="rounded-2xl bg-card/60 p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="text-sm font-medium truncate min-w-0">Son Yapay Zeka Kararları</div>
          <div className="flex items-center gap-1.5 shrink-0">
            {data.aiDecisions?.dataQuality === 'seed' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Seed
              </span>
            )}
            {data.aiDecisions?.dataQuality === 'live' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Live
              </span>
            )}
            {data.aiDecisions?.sourceHealth && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                data.aiDecisions.sourceHealth === 'ok' ? 'bg-emerald-500/20 text-emerald-300' :
                data.aiDecisions.sourceHealth === 'timeout' ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {data.aiDecisions.sourceHealth}
              </span>
            )}
          </div>
        </div>
        {status === 'loading' ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-2">
            {data.aiDecisions?.recent && data.aiDecisions.recent.length > 0 ? (
              data.aiDecisions.recent.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-xs min-w-0">
                  <span className="text-neutral-300 font-medium truncate min-w-0 shrink-0" style={{ minWidth: '100px' }}>
                    {d.action} {formatSymbol(d.symbol)}
                  </span>
                  <span className="text-neutral-400 truncate min-w-0">
                    {d.reason ?? '—'}
                  </span>
                  <span className="text-neutral-300 shrink-0 tabular-nums">
                    {d.confidence !== null ? `${Math.round(d.confidence)}% Conf.` : '—'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-neutral-500">Henüz karar yok.</div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
