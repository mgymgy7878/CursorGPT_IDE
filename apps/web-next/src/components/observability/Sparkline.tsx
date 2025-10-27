// apps/web-next/src/components/observability/Sparkline.tsx
"use client";

export default function Sparkline({
  data,
  width = 180,
  height = 42,
  strokeWidth = 2,
  positiveUpIsGood = true,
}: {
  data: { t: number; v: number }[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  positiveUpIsGood?: boolean;
}) {
  if (!data?.length) return <div className="h-[42px]" />;

  const values = data.map(d => d.v as number).filter(n => Number.isFinite(n));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const path = data
    .map((d, i) => {
      const x = (i / Math.max(1, data.length - 1)) * (width - 2);
      const y = height - 2 - ((Number(d.v) - min) / span) * (height - 4);
      return `${i === 0 ? "M" : "L"}${x + 1},${y + 1}`;
    })
    .join(" ");

  const last = values.at(-1) ?? 0;
  const prev = values.length > 1 ? values.at(-2)! : last;
  const up = last >= prev;
  const good = positiveUpIsGood ? up : !up;
  const stroke = good ? "#16a34a" : "#dc2626"; // green/red

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="sparkline">
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
