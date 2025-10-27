'use client';
import React from "react";

type Props = {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  titleText?: string; // hover tooltip için
};

export default function MiniSparkline({
  values,
  width = 64,
  height = 18,
  className,
  titleText,
}: Props) {
  const n = values.length;
  if (n === 0) {
    return <div className={`h-[${height}px]`}></div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1; // zero-span koruması
  const stepX = width / Math.max(1, n - 1);
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * height; // 0 altta, height üstte
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const up = n > 1 ? values[n - 1] - values[0] >= 0 : false;
  const stroke = n > 1 ? (up ? '#10B981' /* emerald-500 */ : '#EF4444' /* red-500 */) : '#9CA3AF'; // zinc-400

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      {titleText ? <title>{titleText}</title> : null}
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        points={pts.join(' ')}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
} 