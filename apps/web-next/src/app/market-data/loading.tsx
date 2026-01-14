export default function MarketDataLoading() {
  return (
    <div className="h-full flex flex-col min-h-0 p-6">
      <div className="space-y-4 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-neutral-800 rounded"></div>
          <div className="h-8 w-32 bg-neutral-800 rounded"></div>
        </div>
        
        {/* Chart area skeleton */}
        <div className="flex-1 min-h-[400px] bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="p-4 space-y-3">
            <div className="h-6 w-32 bg-neutral-800 rounded"></div>
            <div className="h-64 bg-neutral-800/50 rounded"></div>
            <div className="h-4 w-full bg-neutral-800/30 rounded"></div>
          </div>
        </div>
        
        {/* Info text */}
        <div className="text-center text-neutral-500 text-sm">
          Grafik yükleniyor...
        </div>
      </div>
    </div>
  );
}
