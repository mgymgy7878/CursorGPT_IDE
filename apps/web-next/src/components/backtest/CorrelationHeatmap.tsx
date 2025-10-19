"use client";

import React from "react";

export default function CorrelationHeatmap({
  matrix,
  symbols,
  threshold = 0.7,
}: {
  matrix: number[][];
  symbols: string[];
  threshold?: number;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-black/30 overflow-auto">
      <div className="font-semibold mb-2">Correlation (|r| ≥ {threshold})</div>
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-1 text-left"></th>
            {symbols.map((s) => (
              <th key={s} className="p-1 text-left font-mono">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="p-1 font-mono">{symbols[i]}</td>
              {row.map((v, j) => {
                const intensity = Math.min(1, Math.max(0, Math.abs(v)));
                const bg = v >= 0 ? `rgba(16,185,129,${intensity * 0.35})` : `rgba(239,68,68,${intensity * 0.35})`;
                const b = Math.abs(v) >= threshold ? "border-neutral-700" : "border-transparent";
                return (
                  <td key={j} className={`p-1 border ${b}`} style={{ background: bg }}>
                    {v.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


