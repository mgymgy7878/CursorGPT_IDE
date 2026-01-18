import { useTerminalState } from '@/lib/terminal/useTerminalState';
import { useMarketWatchData } from '@/lib/terminal/useTerminalData';
import { formatSymbol } from '@/lib/format';

export default function MarketWatchPanel() {
  const { selectedSymbol, marketTab, searchQuery, favorites, setMarketTab, setSearchQuery, setSelectedSymbol, toggleFavorite } = useTerminalState();
  const seed = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('seed') === '1';
  const { data } = useMarketWatchData(seed);

  const rows = (data?.tickers ?? []).map((row) => ({
    ...row,
    isFav: favorites[row.symbol] ?? false,
  }));

  const filtered = rows.filter((row) => {
    if (marketTab === 'favorites' && !row.isFav) return false;
    if (marketTab === 'btc' && row.quote !== 'BTC') return false;
    if (marketTab === 'usdt' && row.quote !== 'USDT') return false;
    if (searchQuery && !row.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <section
      className="flex flex-col bg-neutral-950/60 border-r border-white/6 min-h-0"
      data-testid="terminal-marketwatch"
    >
      <div className="px-3 py-2 border-b border-white/6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-neutral-200">Market Watch</div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            data?.dataQuality === 'live' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            {data?.dataQuality === 'live' ? 'Live' : 'Seed'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-full px-2 py-1 text-[11px] bg-neutral-900 border border-white/6 rounded text-neutral-200 placeholder-neutral-500"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-2">
          {(['favorites', 'usdt', 'btc'] as const).map((tab) => (
            <button
              key={tab}
              className={`px-2 py-0.5 rounded ${
                marketTab === tab ? 'bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-900'
              }`}
              onClick={() => setMarketTab(tab)}
            >
              {tab === 'favorites' ? 'Favorites' : tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
        <div className="flex-1 overflow-auto px-2 py-2 text-xs text-neutral-300 space-y-1">
        <div className="grid grid-cols-[1fr_72px_60px] px-2 py-1 text-[10px] text-neutral-500 border-b border-white/6">
          <span>Pair</span>
          <span className="text-right">Last</span>
          <span className="text-right">24h</span>
        </div>
        {filtered.map((row) => {
          const isSelected = row.symbol === selectedSymbol;
          const change = row.change24hPct ?? 0;
          const changeText = row.change24hPct !== null && row.change24hPct !== undefined
            ? `${change >= 0 ? '+' : ''}${(change * 100).toFixed(2)}%`
            : '—';
          return (
            <div
              key={row.symbol}
              className={`grid grid-cols-[1fr_72px_60px] items-center rounded-md px-2 py-1 hover:bg-neutral-900/70 cursor-pointer ${
                isSelected ? 'bg-neutral-900/80' : ''
              }`}
              onClick={() => setSelectedSymbol(row.symbol)}
              data-testid="terminal-marketwatch-row"
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  className="text-[11px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(row.symbol);
                  }}
                  aria-label="Toggle favorite"
                >
                  {row.isFav ? '★' : '☆'}
                </button>
                <span className="truncate">{formatSymbol(row.symbol)}</span>
              </div>
              <span className="text-right tabular-nums">
                {row.last !== null ? row.last.toFixed(2) : '—'}
              </span>
              <span className={`text-right tabular-nums ${
                change >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {changeText}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-xs text-neutral-500 px-2 py-2">No matches.</div>
        )}
      </div>
    </section>
  );
}
