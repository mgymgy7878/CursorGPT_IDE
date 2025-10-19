export interface MetricProps {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}

export default function Metric({ label, value, hint, className }: MetricProps) {
  return (
    <div className="rounded-2xl bg-card/60 p-4">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${className || ''}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}

