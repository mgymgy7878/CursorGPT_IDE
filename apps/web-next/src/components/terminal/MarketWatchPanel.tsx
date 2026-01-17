const pairs = [
  'BTC/USD',
  'ETH/USD',
  'SOL/USD',
  'XRP/USD',
  'ADA/USD',
  'BNB/USD',
  'AVAX/USD',
  'DOT/USD',
  'LINK/USD',
  'MATIC/USD',
];

export default function MarketWatchPanel() {
  return (
    <section
      className="flex flex-col bg-neutral-950/60 border-r border-white/6 min-h-0"
      data-testid="terminal-marketwatch"
    >
      <div className="px-3 py-2 border-b border-white/6">
        <div className="text-xs font-semibold text-neutral-200 mb-2">Market Watch</div>
        <div className="flex items-center gap-2">
          <input
            className="w-full px-2 py-1 text-[11px] bg-neutral-900 border border-white/6 rounded text-neutral-200 placeholder-neutral-500"
            placeholder="Search"
            disabled
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto px-2 py-2 text-xs text-neutral-300 space-y-1">
        {pairs.map((pair) => (
          <div
            key={pair}
            className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-neutral-900/70"
          >
            <span>{pair}</span>
            <span className="text-emerald-400">+0.8%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
