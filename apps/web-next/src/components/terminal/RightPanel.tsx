import { useTerminalState } from '@/lib/terminal/useTerminalState';
import { useOrderBook } from '@/lib/terminal/useTerminalData';

export default function RightPanel() {
  const { selectedSymbol } = useTerminalState();
  const seed = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('seed') === '1';
  const { data } = useOrderBook(selectedSymbol, seed);
  const orderBook = data?.orderBook;

  const asks = orderBook?.asks ?? [];
  const bids = orderBook?.bids ?? [];
  const maxQty = Math.max(
    ...asks.map((a) => a.qty),
    ...bids.map((b) => b.qty),
    1
  );

  return (
    <section
      className="flex flex-col min-h-0 bg-neutral-950/60 border-l border-white/6"
      data-testid="terminal-rightpanel"
    >
      <div className="px-3 py-2 border-b border-white/6 text-xs font-semibold text-neutral-200">
        <div className="flex items-center justify-between">
          <span>Order Book</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            data?.dataQuality === 'live' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            {data?.dataQuality === 'live' ? 'Live' : 'Seed'}
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto text-xs text-neutral-300 px-3 py-2 space-y-1">
        <div className="grid grid-cols-3 text-[10px] text-neutral-500 mb-1">
          <span>Price</span>
          <span>Amount</span>
          <span>Total</span>
        </div>
        {asks.map((lvl, idx) => (
          <div key={`ask-${idx}`} className="grid grid-cols-3 gap-2 relative">
            <span className="text-red-400">{lvl.price.toFixed(2)}</span>
            <span>{lvl.qty.toFixed(3)}</span>
            <span className="text-neutral-500">{(lvl.price * lvl.qty).toFixed(0)}</span>
            <span
              className="absolute right-0 top-0 h-full bg-red-500/10"
              style={{ width: `${(lvl.qty / maxQty) * 100}%` }}
            />
          </div>
        ))}
        {bids.map((lvl, idx) => (
          <div key={`bid-${idx}`} className="grid grid-cols-3 gap-2 relative">
            <span className="text-emerald-400">{lvl.price.toFixed(2)}</span>
            <span>{lvl.qty.toFixed(3)}</span>
            <span className="text-neutral-500">{(lvl.price * lvl.qty).toFixed(0)}</span>
            <span
              className="absolute right-0 top-0 h-full bg-emerald-500/10"
              style={{ width: `${(lvl.qty / maxQty) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="border-t border-white/6 px-3 py-3 text-xs text-neutral-300">
        <div className="flex items-center justify-between mb-2">
          <span>Quick Trade</span>
          <span className="text-[10px] text-neutral-500">Limit</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2 rounded-md bg-emerald-600 text-white">Buy</button>
          <button className="py-2 rounded-md bg-neutral-800 text-neutral-300">Sell</button>
        </div>
      </div>
    </section>
  );
}
