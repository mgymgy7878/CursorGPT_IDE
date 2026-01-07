/**
 * MarketDataTable - Figma Parity v2
 *
 * Columns (Figma order): Sembol | İsim | Mini Grafik | Fiyat | Değişim | Hacim | RSI | Sinyal
 * Features:
 * - İsim kolonu (mock symbol → name map)
 * - RSI kolonu (mock values)
 * - Sinyal badge (BUY/HOLD/STRONG BUY)
 * - 24s/7g/1ay toggle for sparkline (UI only)
 */

'use client';

import { useState } from 'react';
import { DataTable, DataTableHeader, DataTableRow, DataTableCell, DataTableHeaderCell } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { RowActions, RowActionButton } from '@/components/ui/RowActions';
import { RowOverflowMenu } from '@/components/ui/RowOverflowMenu';
import { Sparkline, generateMockSparklineData } from '@/components/ui/Sparkline';
import { formatPriceUsd, formatCompactUsd } from '@/lib/format';
import { IconBarChart } from '@/components/ui/LocalIcons';
import { ChangeCell } from './ChangeCell';
import { uiCopy } from '@/lib/uiCopy';
import { cn } from '@/lib/utils';

// Symbol → Name mapping (Figma parity)
const SYMBOL_NAMES: Record<string, string> = {
  'BTC/USDT': 'Bitcoin',
  'ETH/USDT': 'Ethereum',
  'SOL/USDT': 'Solana',
  'BNB/USDT': 'Binance Coin',
  'ADA/USDT': 'Cardano',
  'XRP/USDT': 'Ripple',
  'DOGE/USDT': 'Dogecoin',
  'DOT/USDT': 'Polkadot',
  'AVAX/USDT': 'Avalanche',
  'MATIC/USDT': 'Polygon',
};

// Signal types (Figma design)
type SignalType = 'BUY' | 'HOLD' | 'STRONG BUY' | 'SELL';

// PATCH W: Deterministic mock data - change values normalized to pct-point (1.2 = 1.2%, not 0.012)
// PATCH W fix: ETH changeAbs should be negative to match negative changePct
const MOCK_MARKET_DATA = [
  { symbol: 'BTC/USDT', price: 42150.00, change: 1.2, changeAbs: 1024.50, spread: 0.05, volume: 1250000000, rsi: 67, signal: 'BUY' as SignalType },
  { symbol: 'ETH/USDT', price: 2250.00, change: -0.5, changeAbs: -11.25, spread: 0.08, volume: 850000000, rsi: 58, signal: 'BUY' as SignalType },
  { symbol: 'SOL/USDT', price: 98.50, change: 5.2, changeAbs: 4.88, spread: 0.12, volume: 320000000, rsi: 72, signal: 'STRONG BUY' as SignalType },
  { symbol: 'BNB/USDT', price: 315.75, change: 0.8, changeAbs: 2.52, spread: 0.06, volume: 180000000, rsi: 55, signal: 'HOLD' as SignalType },
  { symbol: 'ADA/USDT', price: 0.485, change: -2.1, changeAbs: -0.0102, spread: 0.15, volume: 95000000, rsi: 45, signal: 'HOLD' as SignalType },
];

// Signal badge component (Figma colors) - PATCH Q: Türkçeleştirme
function SignalBadge({ signal }: { signal: SignalType }) {
  const variants: Record<SignalType, { bg: string; text: string; border: string; label: string }> = {
    'BUY': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: uiCopy.signals.buy },
    'STRONG BUY': { bg: 'bg-emerald-500/30', text: 'text-emerald-300', border: 'border-emerald-400/40', label: uiCopy.signals.strongBuy },
    'HOLD': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: uiCopy.signals.hold },
    'SELL': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: uiCopy.signals.sell },
  };
  const v = variants[signal];

  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border",
      v.bg, v.text, v.border
    )}>
      {v.label}
    </span>
  );
}

// Time period toggle for sparkline (Figma design)
type TimePeriod = '24s' | '7g' | '1ay';

function TimePeriodToggle({
  value,
  onChange,
}: {
  value: TimePeriod;
  onChange: (v: TimePeriod) => void;
}) {
  const options: TimePeriod[] = ['24s', '7g', '1ay'];

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded bg-white/5 border border-white/10">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors",
            value === opt
              ? "bg-blue-500/20 text-blue-400"
              : "text-white/40 hover:text-white/60"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export interface MarketDataTableProps {
  data?: typeof MOCK_MARKET_DATA;
  loading?: boolean;
  showSparkline?: boolean;
  onViewChart?: (symbol: string) => void;
  onRowClick?: (symbol: string) => void;
  selectedSymbol?: string | null;
}

export default function MarketDataTable({
  data = MOCK_MARKET_DATA,
  loading = false,
  showSparkline = false,
  onViewChart,
  onRowClick,
  selectedSymbol,
}: MarketDataTableProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('24s');

  if (loading) {
    return (
      <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/80">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-neutral-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // PATCH W.3 (P0): Tablo wrapper - overflow-x-auto (gerekirse), kartın iç padding'inde boğma
  // PATCH W.3.1: Scrollbar dark theme uyumu + padding düzenlemesi (scroll'u kartın gövdesine yedirme)
  return (
    <div
      className="w-full min-w-0 overflow-x-auto table-wrapper -mx-5 px-5"
      style={{
        maxHeight: 'calc(100dvh - var(--topbar-h, 56px) - 120px)',
      }}
    >
      {/* PATCH W.3.1: min-w responsive kolonlara göre optimize (sparkline yoksa daha küçük) */}
      <DataTable className={cn("table-fixed", showSparkline ? "min-w-[800px]" : "min-w-[600px]")}>
        <colgroup>
          <col style={{ width: '120px' }} />
          <col style={{ width: '180px' }} />
          {showSparkline && <col style={{ width: '260px' }} />}
          <col style={{ width: '100px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '100px' }} />
          <col className="hidden xl:table-column" style={{ width: '80px' }} />
          <col style={{ width: '140px' }} />
          <col className="hidden lg:table-column" style={{ width: '100px' }} />
        </colgroup>
        <DataTableHeader>
          <DataTableRow hover={false} className="h-[40px] sticky top-0 bg-white/3 z-10">
            <DataTableHeaderCell className="text-[10px] font-medium text-[#9CA3AF] leading-none py-[var(--table-head-py,8px)]">Sembol</DataTableHeaderCell>
            <DataTableHeaderCell className="text-[10px] font-medium text-[#9CA3AF] leading-none py-[var(--table-head-py,8px)]">İsim</DataTableHeaderCell>
            {showSparkline && (
              <DataTableHeaderCell className="text-center text-[10px] font-medium text-[#9CA3AF] leading-none py-[var(--table-head-py,8px)]">
                <div className="flex items-center justify-center gap-2">
                  <span>Mini Grafik</span>
                  <TimePeriodToggle value={timePeriod} onChange={setTimePeriod} />
                </div>
              </DataTableHeaderCell>
            )}
            <DataTableHeaderCell className="text-right text-[10px] font-medium text-[#9CA3AF] leading-none tabular-nums py-[var(--table-head-py,8px)]">Fiyat</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right text-[10px] font-medium text-[#9CA3AF] leading-none tabular-nums py-[var(--table-head-py,8px)]">Değişim</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right text-[10px] font-medium text-[#9CA3AF] leading-none tabular-nums py-[var(--table-head-py,8px)]">Hacim</DataTableHeaderCell>
            {/* PATCH W.3 (P0): Responsive kolon - RSI dar ekranda gizle */}
            <DataTableHeaderCell className="hidden xl:table-cell text-center text-[10px] font-medium text-[#9CA3AF] leading-none tabular-nums py-[var(--table-head-py,8px)]">RSI</DataTableHeaderCell>
            <DataTableHeaderCell className="text-center text-[10px] font-medium text-[#9CA3AF] leading-none" style={{ paddingTop: '6px', paddingBottom: '6px' }}>Sinyal</DataTableHeaderCell>
            {/* PATCH W.3 (P0): Responsive kolon - Actions dar ekranda gizle */}
            {/* PATCH W.3.1: uiCopy'den al */}
            <DataTableHeaderCell className="hidden lg:table-cell text-right text-[10px] font-medium text-[#9CA3AF] leading-none" style={{ paddingTop: '6px', paddingBottom: '6px' }}>{uiCopy.table.actions}</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHeader>
        <tbody>
          {data.length === 0 ? (
            <DataTableRow>
              {/* PATCH W.3 (P0): colSpan tüm kolonları kapsasın (responsive kolonlar dahil) */}
              <DataTableCell colSpan={showSparkline ? 9 : 8} className="py-12 text-center">
                <div className="text-neutral-400 text-sm">No market data available</div>
              </DataTableCell>
            </DataTableRow>
          ) : (
            data.map((row) => {
              const isSelected = selectedSymbol === row.symbol;
              return (
              <DataTableRow
                key={row.symbol}
                className={cn(
                  "cursor-pointer border-b border-white/5",
                  "min-h-[40px] h-[40px]",
                  isSelected && "border-l-2 border-emerald-500 bg-emerald-500/5 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]",
                  !isSelected && "hover:bg-white/3"
                )}
                onClick={() => onRowClick?.(row.symbol)}
              >
                {/* Sembol */}
                <DataTableCell className="px-[var(--cell-px,12px)]" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                  <span className="font-medium text-[11px] text-[#E5E7EB]">{row.symbol}</span>
                </DataTableCell>

                {/* İsim */}
                <DataTableCell className="px-[var(--cell-px,12px)]" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                  <span className="text-[#9CA3AF] text-[10px]">
                    {SYMBOL_NAMES[row.symbol] || row.symbol.split('/')[0]}
                  </span>
                </DataTableCell>

                {/* Mini Grafik */}
                {showSparkline && (
                  <DataTableCell className="px-[var(--cell-px,12px)]" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                    {/* PATCH W.3 (P0): Sabit genişlik kaldırıldı (w-[160px]) */}
                    <div className="flex justify-center items-center h-full">
                      <Sparkline
                        data={generateMockSparklineData(row.symbol, row.change >= 0, 24)}
                        width={140}
                        height={28}
                        isPositive={row.change >= 0}
                      />
                    </div>
                  </DataTableCell>
                )}

                {/* PATCH Y: Fiyat - formatPriceUsd (smart decimals) */}
                <DataTableCell className="text-right tabular-nums px-[var(--cell-px,12px)]" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                  <MonoNumber value={formatPriceUsd(row.price)} className="text-[11px] font-mono" />
                </DataTableCell>

                {/* PATCH V: Değişim - ChangeCell (ok ikon + $ delta üst + % alt) */}
                <DataTableCell className="text-right px-[var(--cell-px,12px)]" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                  <ChangeCell changeAbs={row.changeAbs} changePct={row.change} />
                </DataTableCell>

                {/* PATCH V: Hacim - formatCompactUsd */}
                <DataTableCell className="text-right tabular-nums px-[var(--cell-px,12px)]" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">{formatCompactUsd(row.volume)}</span>
                </DataTableCell>

                {/* PATCH W.3 (P0): RSI - responsive kolon (dar ekranda gizle) */}
                <DataTableCell className="hidden xl:table-cell text-center tabular-nums px-[var(--cell-px,12px)]" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                  <span className={cn(
                    "text-[10px] font-medium font-mono",
                    row.rsi > 70 ? "text-[#f97373]" :
                    row.rsi < 30 ? "text-[#4ade80]" :
                    "text-[#9CA3AF]"
                  )}>
                    {row.rsi}
                  </span>
                </DataTableCell>

                {/* Sinyal */}
                <DataTableCell className="text-center px-[var(--cell-px,12px)]" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                  <div className="flex items-center justify-center gap-2">
                    <SignalBadge signal={row.signal} />
                    {/* PATCH W.4: Overflow menu - lg'den küçük ekranlarda Actions yerine */}
                    <div className="lg:hidden" onClick={(e) => e.stopPropagation()}>
                      <RowOverflowMenu>
                        <RowActionButton
                          icon={<IconBarChart size={14} strokeWidth={1.8} />}
                          label={uiCopy.tooltip.chart}
                          onClick={() => onViewChart?.(row.symbol)}
                        />
                        <RowActionButton icon="⚙️" label={uiCopy.tooltip.settings} />
                      </RowOverflowMenu>
                    </div>
                  </div>
                </DataTableCell>

                {/* PATCH W.3 (P0): Actions - responsive kolon (dar ekranda gizle) */}
                {/* PATCH W.4: lg'den küçük ekranlarda overflow menu Sinyal kolonunda görünür */}
                <DataTableCell className="hidden lg:table-cell text-right px-[var(--cell-px,12px)]" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                  <div onClick={(e) => e.stopPropagation()}>
                  <RowActions>
                      <RowActionButton
                        icon={<IconBarChart size={14} strokeWidth={1.8} />}
                        label={uiCopy.tooltip.chart}
                        onClick={() => onViewChart?.(row.symbol)}
                      />
                    <RowActionButton icon="⚙️" label={uiCopy.tooltip.settings} />
                  </RowActions>
                  </div>
                </DataTableCell>
              </DataTableRow>
              );
            })
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
