export default function StrategiesLoading() {
  return (
    <div className="p-6">
      {/* Skeleton for tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
          <div className="h-9 w-20 rounded bg-white/10 animate-pulse" />
          <div className="h-9 w-20 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
      
      {/* Skeleton for content */}
      <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
        <div className="h-24 rounded bg-white/5 animate-pulse" />
        <div className="h-24 rounded bg-white/5 animate-pulse" />
        <div className="h-24 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

