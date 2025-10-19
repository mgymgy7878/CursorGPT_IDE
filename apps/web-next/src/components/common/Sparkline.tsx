"use client";
export default function Sparkline({ data, width=140, height=36, strokeWidth=2, title }:{
  data: number[]; width?: number; height?: number; strokeWidth?: number; title?: string;
}){
  const pad = 2;
  const w = width - pad*2, h = height - pad*2;
  const n = Math.max(1, data.length);
  const min = Math.min(...data, 0), max = Math.max(...data, 1);
  const rng = max - min || 1;
  const step = w / Math.max(1, n - 1);
  const pts = data.map((v,i)=>{
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / rng) * h;
    return `${i===0?"M":"L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  const last = data[data.length-1] ?? 0;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-label={title??"sparkline"}>
      <path d={pts} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
      <title>{(title ?? "") + ` — last: ${last}`}</title>
    </svg>
  );
}


