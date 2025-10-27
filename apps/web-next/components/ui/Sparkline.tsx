"use client";

type Props = { data: number[]; width?: number; height?: number; strokeWidth?: number; };

export default function Sparkline({ data, width = 120, height = 28, strokeWidth = 2 }: Props) {
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data), max = Math.max(...data);
  const norm = (v: number) => {
    if (max === min) return height / 2;
    const t = (v - min) / (max - min);
    return height - t * height;
  };
  const step = width / (data.length - 1);
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
  return (
    <svg width={width} height={height}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
} 
