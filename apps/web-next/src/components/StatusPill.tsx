"use client";
export function StatusPill({ label, value }: { label: string; value: string }){
  const color = value === "healthy" ? "bg-green-600" : value === "offline" ? "bg-amber-700" : "bg-red-600";
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs text-white ${color}`}>
      {label}: {value}
    </span>
  );
}


