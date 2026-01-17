const levels = [
  { price: '42160.50', amount: '0.542', total: '42K', side: 'ask' },
  { price: '42156.20', amount: '0.840', total: '35K', side: 'bid' },
  { price: '42150.80', amount: '1.120', total: '28K', side: 'bid' },
];

export default function RightPanel() {
  return (
    <section
      className="flex flex-col min-h-0 bg-neutral-950/60 border-l border-white/6"
      data-testid="terminal-rightpanel"
    >
      <div className="px-3 py-2 border-b border-white/6 text-xs font-semibold text-neutral-200">
        Order Book
      </div>
      <div className="flex-1 min-h-0 overflow-auto text-xs text-neutral-300 px-3 py-2 space-y-1">
        <div className="grid grid-cols-3 text-[10px] text-neutral-500 mb-1">
          <span>Price</span>
          <span>Amount</span>
          <span>Total</span>
        </div>
        {levels.map((lvl, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2">
            <span className={lvl.side === 'ask' ? 'text-red-400' : 'text-emerald-400'}>
              {lvl.price}
            </span>
            <span>{lvl.amount}</span>
            <span className="text-neutral-500">{lvl.total}</span>
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
