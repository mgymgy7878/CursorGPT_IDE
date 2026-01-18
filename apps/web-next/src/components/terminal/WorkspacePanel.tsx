import { formatSymbol } from '@/lib/format';
import { useTerminalState } from '@/lib/terminal/useTerminalState';
import { useMarketWatchData } from '@/lib/terminal/useTerminalData';

const tabs = ['Open Positions', 'Open Orders', 'Order History', 'Trade History'];

export default function WorkspacePanel() {
  const { selectedSymbol } = useTerminalState();
  const seed = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('seed') === '1';
  const { data } = useMarketWatchData(seed);
  const selected = data?.tickers.find((row) => row.symbol === selectedSymbol);
  const change = selected?.change24hPct ?? null;

  return (
    <section
      className="flex flex-col min-h-0 bg-neutral-950/40"
      data-testid="terminal-workspace"
    >
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/6 text-xs text-neutral-300">
        {tabs.map((tab) => (
          <button
            key={tab}
            className="px-2 py-1 rounded-md bg-neutral-900/70 hover:bg-neutral-800 transition-colors"
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 bg-neutral-900/40 border-b border-white/6 px-3 py-2">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <div>
              <div className="text-[11px] font-semibold">{formatSymbol(selectedSymbol)}</div>
              <div className="text-[10px] text-neutral-500">Selected</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold">
                {selected?.last !== null && selected?.last !== undefined ? selected.last.toFixed(2) : '—'}
              </div>
              <div className={`text-[10px] ${
                change !== null && change !== undefined && change >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {change !== null && change !== undefined
                  ? `${change >= 0 ? '+' : ''}${(change * 100).toFixed(2)}%`
                  : '—'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto text-xs text-neutral-300">
          <div className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-white/6 text-[10px] text-neutral-500">
            <span>Symbol</span>
            <span>Size</span>
            <span>Entry</span>
            <span>PNL</span>
            <span>ROE</span>
          </div>
          {['BTC/USD', 'ETH/USD', 'SOL/USD'].map((pair) => (
            <div
              key={pair}
              className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-white/4"
            >
              <span>{pair}</span>
              <span>0.45</span>
              <span>41,850</span>
              <span className="text-emerald-400">+3.6%</span>
              <span className="text-emerald-400">+12%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
