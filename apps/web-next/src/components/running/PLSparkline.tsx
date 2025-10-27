"use client";
import { useMemo } from "react";

export default function PLSparkline({ points }: { points: { ts:number; pnl:number }[] }) {
  const path = useMemo(() => {
    if (!points?.length) return "";
    const w = 280, h = 64, pad = 6;
    const xs = points.map(p=>p.ts);
    const ys = points.map(p=>p.pnl);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const nx = (x:number)=> pad + (w-2*pad) * (maxX===minX ? 1 : (x-minX)/(maxX-minX));
    const ny = (y:number)=> h-pad - (h-2*pad) * (maxY===minY ? 0.5 : (y-minY)/(maxY-minY));
    return points.map((p,i)=> (i? "L":"M") + nx(p.ts) + " " + ny(p.pnl)).join(" ");
  }, [points]);

  const last = points.at(-1)?.pnl ?? 0;
  const stroke = last>0 ? "currentColor" : last<0 ? "currentColor" : "currentColor";
  const cls = last>0 ? "text-emerald-600" : last<0 ? "text-red-600" : "text-neutral-500";

  return (
    <svg width="100%" height="64" viewBox="0 0 280 64" className={cls} aria-hidden>
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}
