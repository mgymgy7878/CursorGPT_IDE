const tabs = ['Chart', 'Positions', 'Orders'];

export default function WorkspacePanel() {
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
        <div className="flex-1 bg-neutral-900/40 border-b border-white/6 flex items-center justify-center text-neutral-500 text-xs">
          Chart placeholder
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
