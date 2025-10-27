'use client';
import React from 'react';
import type { Account, AssetRow } from '@/lib/api/portfolio';

export function Accounts({ rows }: { rows: Account[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr><th className="px-3 py-2">Borsa</th><th className="px-3 py-2">Equity (USD)</th><th className="px-3 py-2">P/L 24h</th><th className="px-3 py-2">Pozisyon</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{r.exchange}</td>
              <td className="px-3 py-2">{r.equityUSD.toLocaleString()}</td>
              <td className={`px-3 py-2 ${r.pnl24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{r.pnl24h >= 0 ? '+' : ''}{r.pnl24h}</td>
              <td className="px-3 py-2">{r.positions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Assets({ rows }: { rows: AssetRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr><th className="px-3 py-2">Varlık</th><th className="px-3 py-2">Miktar</th><th className="px-3 py-2">Fiyat</th><th className="px-3 py-2">Değer</th><th className="px-3 py-2">Portföy %</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{r.asset}</td>
              <td className="px-3 py-2">{r.qty}</td>
              <td className="px-3 py-2">{r.price}</td>
              <td className="px-3 py-2">{r.value.toLocaleString()}</td>
              <td className="px-3 py-2">{(r.pct).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


