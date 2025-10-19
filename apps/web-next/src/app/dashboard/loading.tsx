export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-neutral-800 rounded mb-2"></div>
        <div className="h-4 w-64 bg-neutral-800 rounded mb-6"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-32 bg-neutral-800 rounded-2xl"></div>
          <div className="h-32 bg-neutral-800 rounded-2xl"></div>
          <div className="h-32 bg-neutral-800 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}