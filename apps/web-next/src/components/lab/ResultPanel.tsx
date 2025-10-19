"use client";
import React from "react";

type MetricSet = { cagr?: number; sharpe?: number; maxDD?: number; winRate?: number; pf?: number };

export function ResultPanel({ result }:{ result?: { equity?: Array<{t:number,v:number}>, metrics?: MetricSet } }){
  const m = result?.metrics ?? {};
  return (
    <div className="p-3 border rounded-xl">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
        <Metric label="CAGR" v={m.cagr} />
        <Metric label="Sharpe" v={m.sharpe} />
        <Metric label="maxDD" v={m.maxDD} />
        <Metric label="WinRate" v={m.winRate} />
        <Metric label="PF" v={m.pf} />
      </div>
      <div className="mt-3 h-24 bg-gray-100 rounded-md flex items-center justify-center">
        <span className="text-xs text-gray-500">Equity Curve (mock)</span>
      </div>
    </div>
  );
}

function Metric({label,v}:{label:string; v?:number}){ return (
  <div className="p-2 bg-gray-50 rounded-md border text-center">
    <div className="text-[10px] text-gray-500">{label}</div>
    <div className="font-semibold">{Number.isFinite(v!)? (v as number).toFixed(2) : "NA"}</div>
  </div>
);}


