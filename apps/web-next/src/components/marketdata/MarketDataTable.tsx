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
import { DeltaText } from '@/components/ui/DeltaText';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { RowActions, RowActionButton } from '@/components/ui/RowActions';
import { Sparkline, generateMockSparklineData } from '@/components/ui/Sparkline';
import { formatCurrency, formatNumber } from '@/lib/format';
import { IconBarChart } from '@/components/ui/LocalIcons';
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

// Deterministic mock data with RSI and Signal
const MOCK_MARKET_DATA = [
  { symbol: 'BTC/USDT', price: 42150.00, change: 1.2, spread: 0.05, volume: 1250000000, rsi: 67, signal: 'BUY' as SignalType },
  { symbol: 'ETH/USDT', price: 2250.00, change: -0.5, spread: 0.08, volume: 850000000, rsi: 58, signal: 'BUY' as SignalType },
  { symbol: 'SOL/USDT', price: 98.50, change: 5.2, spread: 0.12, volume: 320000000, rsi: 72, signal: 'STRONG BUY' as SignalType },
  { symbol: 'BNB/USDT', price: 315.75, change: 0.8, spread: 0.06, volume: 180000000, rsi: 55, signal: 'HOLD' as SignalType },
  { symbol: 'ADA/USDT', price: 0.485, change: -2.1, spread: 0.15, volume: 95000000, rsi: 45, signal: 'HOLD' as SignalType },
];

// Signal badge component (Figma colors)
function SignalBadge({ signal }: { signal: SignalType }) {
  const variants: Record<SignalType, { bg: string; text: string; border: string }> = {
    'BUY': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'STRONG BUY': { bg: 'bg-emerald-500/30', text: 'text-emerald-300', border: 'border-emerald-400/40' },
    'HOLD': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    'SELL': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  };
  const v = variants[signal];

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border",
      v.bg, v.text, v.border
    )}>
      {signal}
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

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-neutral-800">
      <DataTable>
        <DataTableHeader>
          <DataTableRow hover={false}>
            <DataTableHeaderCell>Sembol</DataTableHeaderCell>
            <DataTableHeaderCell>İsim</DataTableHeaderCell>
            {showSparkline && (
              <DataTableHeaderCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>Mini Grafik</span>
                  <TimePeriodToggle value={timePeriod} onChange={setTimePeriod} />
                </div>
              </DataTableHeaderCell>
            )}
            <DataTableHeaderCell className="text-right">Fiyat</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Değişim</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Hacim</DataTableHeaderCell>
            <DataTableHeaderCell className="text-center">RSI</DataTableHeaderCell>
            <DataTableHeaderCell className="text-center">Sinyal</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Actions</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHeader>
        <tbody>
          {data.length === 0 ? (
            <DataTableRow>
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
                  "h-12 cursor-pointer transition-colors",
                  isSelected && "bg-emerald-500/10 border-l-2 border-emerald-500"
                )}
                onClick={() => onRowClick?.(row.symbol)}
              >
                {/* Sembol */}
                <DataTableCell className="py-3">
                  <span className="font-semibold text-neutral-200">{row.symbol}</span>
                </DataTableCell>

                {/* İsim */}
                <DataTableCell className="py-3">
                  <span className="text-neutral-400 text-[12px]">
                    {SYMBOL_NAMES[row.symbol] || row.symbol.split('/')[0]}
                  </span>
                </DataTableCell>

                {/* Mini Grafik */}
                {showSparkline && (
                  <DataTableCell className="py-3">
                    <div className="flex justify-center">
                      <Sparkline
                        data={generateMockSparklineData(row.symbol, row.change >= 0, 24)}
                        width={80}
                        height={24}
                        isPositive={row.change >= 0}
                      />
                    </div>
                  </DataTableCell>
                )}

                {/* Fiyat */}
                <DataTableCell className="text-right py-3">
                  <MonoNumber value={formatCurrency(row.price, 'USD')} />
                </DataTableCell>

                {/* Değişim */}
                <DataTableCell className="text-right py-3">
                  <DeltaText value={row.change} />
                </DataTableCell>

                {/* Hacim */}
                <DataTableCell className="text-right py-3">
                  <MonoNumber value={`${formatNumber(row.volume / 1000000)}M`} className="text-neutral-300" />
                </DataTableCell>

                {/* RSI */}
                <DataTableCell className="text-center py-3">
                  <span className={cn(
                    "text-[12px] font-mono tabular-nums",
                    row.rsi >= 70 ? "text-emerald-400" :
                    row.rsi <= 30 ? "text-red-400" :
                    "text-neutral-400"
                  )}>
                    {row.rsi}
                  </span>
                </DataTableCell>

                {/* Sinyal */}
                <DataTableCell className="text-center py-3">
                  <SignalBadge signal={row.signal} />
                </DataTableCell>

                {/* Actions */}
                <DataTableCell className="text-right py-3">
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowActions>
                      <RowActionButton
                        icon={<IconBarChart size={14} strokeWidth={1.8} />}
                        label="View chart"
                        onClick={() => onViewChart?.(row.symbol)}
                      />
                      <RowActionButton icon="⚙️" label="Settings" />
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
