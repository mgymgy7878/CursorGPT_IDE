"use client";

import React from "react";

type SliceSummary = {
  pnl?: number;
  sharpe?: number;
  winRate?: number;
  maxdd?: number;
};

export default function MetricsCards({
  train,
  test,
  overfitting,
}: {
  train?: SliceSummary;
  test?: SliceSummary;
  overfitting?: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div className="p-3 rounded-lg border border-neutral-800">
        <div className="text-xs opacity-70">Train Sharpe</div>
        <div className="text-lg font-semibold">{train?.sharpe?.toFixed?.(2) ?? "-"}</div>
      </div>
      <div className="p-3 rounded-lg border border-neutral-800">
        <div className="text-xs opacity-70">Test Sharpe</div>
        <div className="text-lg font-semibold">{test?.sharpe?.toFixed?.(2) ?? "-"}</div>
      </div>
      <div className="p-3 rounded-lg border border-neutral-800">
        <div className="text-xs opacity-70">Test Win Rate</div>
        <div className="text-lg font-semibold">{test?.winRate != null ? `${(test.winRate * 100).toFixed(1)}%` : "-"}</div>
      </div>
      <div className="p-3 rounded-lg border border-neutral-800">
        <div className="text-xs opacity-70">Overfitting</div>
        <div className={`text-lg font-semibold ${overfitting && overfitting > 0.2 ? "text-orange-400" : ""}`}>
          {overfitting?.toFixed?.(3) ?? "-"}
        </div>
      </div>
    </div>
  );
}


