/**
 * Dashboard V2 - Figma parity dashboard with live data
 *
 * Feature flag: SPARK_DASHBOARD_V2
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    const root = document.documentElement;
    const prevPadX = root.style.getPropertyValue('--page-px');
    const prevPadTop = root.style.getPropertyValue('--page-pt');
    const prevPadBottom = root.style.getPropertyValue('--page-pb');
    root.style.setProperty('--page-px', '2px');
    root.style.setProperty('--page-pt', '0px');
    root.style.setProperty('--page-pb', '0px');
    return () => {
      if (prevPadX) root.style.setProperty('--page-px', prevPadX);
      else root.style.removeProperty('--page-px');
      if (prevPadTop) root.style.setProperty('--page-pt', prevPadTop);
      else root.style.removeProperty('--page-pt');
      if (prevPadBottom) root.style.setProperty('--page-pb', prevPadBottom);
      else root.style.removeProperty('--page-pb');
    };
  }, []);

  const sparkPointsBySymbol = useMemo(() => {
    const map = new Map<string, string | null>();
    (data.market?.symbols ?? []).forEach((s) => {
      const values = sparkBufferRef.current.get(s.symbol) ?? [];
      map.set(s.symbol, buildSparklinePoints(values));
    });
    return map;
  }, [data.market?.symbols]);

  const marketRows = (data.market?.symbols ?? []).slice(0, 3);
  const strategyRows = (data.strategies?.top ?? []).slice(0, 3);
  const decisionRows = (data.aiDecisions?.recent ?? []).slice(0, 2);

  const renderNotice = (message: string) => (
    <div className="mt-1 rounded border border-neutral-800 bg-neutral-900/40 px-1.5 py-0.5 text-[9px] text-neutral-400 leading-none">
      {message}
    </div>
  );

  return (
    <div
      className="relative h-full min-h-0 px-1 py-0.5 bg-neutral-950 overflow-hidden flex flex-col"
      data-page="dashboard-v2"
      data-testid="dashboard-v2-root"
      style={{ height: 'calc(100% - 48px)' }}
    >
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
      <div className="mb-0 min-w-0">
        <div className="flex items-center justify-between gap-2 h-6 overflow-hidden">
          <h1 className="text-[11px] font-semibold truncate min-w-0 leading-none">Spark</h1>
          <div className="flex items-center gap-1 text-[8px] text-neutral-400 whitespace-nowrap overflow-hidden leading-none">
            <span className="px-1.5 py-0.5 rounded shrink-0 bg-neutral-800 text-neutral-300">
              V2: ON
            </span>
            <span className={`px-1.5 py-0.5 rounded shrink-0 ${
              status === 'live' ? 'bg-emerald-500/20 text-emerald-300' :
              status === 'degraded' ? 'bg-amber-500/20 text-amber-300' :
              'bg-neutral-800 text-neutral-400'
            }`}>
              {status === 'live' ? 'Live' : status === 'degraded' ? 'Degraded' : 'Loading'}
            </span>
            {data.latency?.p95Ms !== null && (
              <span className="shrink-0">P95 {data.latency.p95Ms}ms</span>
            )}
            <span className="shrink-0">Feed {data.system.feed.ok ? 'OK' : 'DOWN'}</span>
            <span className="shrink-0">Exec {data.system.executor.ok ? 'OK' : 'DOWN'}</span>
            {data._meta?.fetchTimeMs !== undefined && (
              <span className="shrink-0">{data._meta.fetchTimeMs}ms</span>
            )}
            {data._meta?.sourceHealth?.binance && (
              <span className={`px-1.5 py-0.5 rounded shrink-0 ${
                data._meta.sourceHealth.binance === 'ok' ? 'bg-emerald-500/20 text-emerald-300' :
                data._meta.sourceHealth.binance === 'timeout' ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                Binance: {data._meta.sourceHealth.binance}
              </span>
            )}
            {error && (
              <span className="text-red-400 shrink-0">Error: {error.message}</span>
            )}
          </div>
        </div>
        {status !== 'live' && (
          <div className="mt-0.5 rounded border border-neutral-800 bg-neutral-900/40 px-1 py-0.5 text-[8px] text-neutral-400 leading-none">
            {status === 'loading'
              ? 'Veriler yükleniyor…'
              : 'Veri bekleniyor (seed/degraded).'}
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-12 grid-rows-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-0.5 flex-1 min-h-0">
        {/* Portfolio Summary */}
        <div className="col-span-12 xl:col-span-7 rounded-lg bg-card/60 p-0.5 min-h-0 h-full overflow-hidden" data-testid="ai-decisions-card">
          <div className="text-[8px] font-semibold mb-0.5">Portföy Özeti</div>
          {status === 'loading' ? (
            <Skeleton className="h-6" />
          ) : (
            <div className="grid grid-cols-3 gap-1">
              <div>
                <div className="text-[8px] text-neutral-500 mb-0.5">Toplam Varlık</div>
                <div className="text-[9px] font-semibold tabular-nums leading-none">
                  {formatMoney(data.portfolio?.totalAsset)}
                </div>
              </div>
              <div>
                <div className="text-[8px] text-neutral-500 mb-0.5">Günlük PnL</div>
                <div className={`text-[9px] font-semibold tabular-nums leading-none ${
                  data.portfolio && data.portfolio.dailyPnL !== null && data.portfolio.dailyPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {data.portfolio && data.portfolio.dailyPnL !== null ? formatMoney(data.portfolio.dailyPnL) : '—'}
                </div>
              </div>
              <div>
                <div className="text-[8px] text-neutral-500 mb-0.5">Margin Level</div>
                <div className={`text-[9px] font-semibold tabular-nums leading-none ${
                  data.portfolio && data.portfolio.marginLevel !== null && data.portfolio.marginLevel >= 100 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {data.portfolio && data.portfolio.marginLevel !== null ? `${data.portfolio.marginLevel}%` : '—'}
                </div>
              </div>
            </div>
          )}
          {!data.portfolio && renderNotice('Portföy verisi henüz hazır değil.')}
        </div>

        {/* Market Status */}
        <div className="col-span-12 xl:col-span-5 rounded-lg bg-card/60 p-0.5 min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between mb-0.5 gap-2">
            <div className="text-[8px] font-semibold truncate min-w-0">Piyasa Durumu</div>
            <div className="flex items-center gap-2 shrink-0">
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
              <Link href="/market-data" className="text-[11px] text-neutral-500 hover:text-neutral-300">
                Tümünü gör
              </Link>
            </div>
          </div>
          {data._meta?.dataQuality?.market === 'seed' && renderNotice('Piyasa verisi seed/degraded modunda.')}
          {status === 'loading' ? (
            <Skeleton className="h-6" />
          ) : (
            <div className="space-y-0.5">
              {marketRows.length > 0 ? (
                marketRows.map((s) => (
                  <div
                    key={s.symbol}
                    className="flex items-center justify-between gap-2 text-xs min-w-0"
                  >
                    <span className="text-neutral-300 font-medium truncate min-w-0 shrink-0" style={{ minWidth: '70px' }}>
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
                    {s.change24h !== null ? (
                      <span className={`tabular-nums shrink-0 font-medium ${
                        s.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatPct(s.change24h)}
                      </span>
                    ) : (
                      <span className="text-neutral-500 shrink-0">—</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-neutral-500">Piyasa verisi yükleniyor...</div>
              )}
            </div>
          )}
        </div>

        {/* Active Strategies */}
        <div className="col-span-12 xl:col-span-7 rounded-lg bg-card/60 p-0.5 min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between mb-0.5 gap-2">
            <div className="text-[8px] font-semibold truncate min-w-0">Aktif Stratejiler</div>
            <div className="flex items-center gap-2 shrink-0">
              {data.strategies && data.strategies.active !== null && data.strategies.active > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
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
              <Link href="/strategies" className="text-[11px] text-neutral-500 hover:text-neutral-300">
                Tümünü gör
              </Link>
            </div>
          </div>
          {data.strategies?.dataQuality === 'seed' && renderNotice('Strateji verisi seed/degraded modunda.')}
          {status === 'loading' ? (
            <Skeleton className="h-6" />
          ) : (
            <div className="space-y-0.5">
              {strategyRows.length > 0 ? (
                strategyRows.map((s, idx) => (
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
            </div>
          )}
        </div>

        {/* Risk Status */}
        <div className="col-span-12 xl:col-span-5 rounded-lg bg-card/60 p-0.5 min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between mb-0.5 gap-2">
            <div className="text-[8px] font-semibold">Risk Durumu</div>
            {data.risk?.level && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                data.risk.level === 'low' ? 'bg-emerald-500/20 text-emerald-300' :
                data.risk.level === 'moderate' ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {data.risk.level === 'low' ? 'Low' : data.risk.level === 'moderate' ? 'Moderate' : 'High'}
              </span>
            )}
          </div>
          {!data.risk && renderNotice('Risk verisi henüz hazır değil.')}
          {status === 'loading' ? (
            <Skeleton className="h-6" />
          ) : (
            <div className="space-y-0.5">
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

        {/* AI Decisions */}
        <div className="col-span-12 xl:col-span-7 rounded-lg bg-card/60 p-0.5 min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between mb-0.5 gap-2">
            <div className="text-[8px] font-semibold truncate min-w-0">Son Yapay Zeka Kararları</div>
            <div className="flex items-center gap-2 shrink-0">
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
              <Link href="/audit" className="text-[11px] text-neutral-500 hover:text-neutral-300">
                Tümünü gör
              </Link>
            </div>
          </div>
          {data.aiDecisions?.dataQuality === 'seed' && renderNotice('AI kararları seed/degraded modunda.')}
          {status === 'loading' ? (
            <Skeleton className="h-6" />
          ) : (
            <div className="space-y-0.5">
              {decisionRows.length > 0 ? (
                decisionRows.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 text-xs min-w-0" data-testid="ai-decision-item">
                    <span className="text-neutral-300 font-medium truncate min-w-0 shrink-0" style={{ minWidth: '100px' }}>
                      {d.action} {formatSymbol(d.symbol)}
                    </span>
                    <span className="text-neutral-400 truncate min-w-0">
                      {d.reason ?? '—'}
                    </span>
                    <span className="text-neutral-300 shrink-0 tabular-nums">
                      {d.confidence !== null ? `${Math.round(d.confidence)}%` : '—'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-neutral-500 min-h-[12px] leading-tight" data-testid="ai-decisions-empty">
                  Henüz karar yok.
                </div>
              )}
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="col-span-12 xl:col-span-5 rounded-lg bg-card/60 p-0.5 min-h-0 h-full overflow-hidden">
          <div className="text-[8px] font-semibold mb-0.5">Sistem Sağlığı</div>
          {status !== 'live' && renderNotice('Sistem metrikleri kısmi veya gecikmeli olabilir.')}
          {status === 'loading' ? (
            <Skeleton className="h-6" />
          ) : (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">API Latency</span>
                <span className="text-neutral-300 tabular-nums font-medium">
                  {data.latency?.p95Ms !== null ? `${data.latency.p95Ms}ms` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">WS / Feed</span>
                <span className={`tabular-nums font-medium ${
                  data.system.feed.ok ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {data.system.feed.ok ? 'OK' : 'DOWN'}
                  {data.system.feed.stalenessSec ? ` (${data.system.feed.stalenessSec}s)` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Executor</span>
                <span className={`tabular-nums font-medium ${
                  data.system.executor.ok ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {data.system.executor.ok ? 'OK' : 'DOWN'}
                  {data.system.executor.latencyMs !== null ? ` (${data.system.executor.latencyMs}ms)` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">OrderBus</span>
                <span className="text-neutral-300 tabular-nums font-medium">—</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
