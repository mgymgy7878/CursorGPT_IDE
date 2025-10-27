'use client';
import React, { useEffect, useState } from 'react';

type Row = { id: string; key: string; oldVal: unknown; newVal: unknown };

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const headers: HeadersInit = { 'x-role': 'admin', 'x-actor': 'local@user' };

  async function refresh() {
    try {
      const r = await fetch('/api/guardrails/params/pending', { headers, cache: 'no-store' });
      const j = await r.json(); 
      setRows(j.items ?? []);
    } catch (e) {
      console.error('Refresh failed:', e);
      setRows([]);
    }
  }
  async function approve(id: string) {
    try {
      await fetch('/api/guardrails/params/approve', { method: 'POST', headers, body: JSON.stringify({ id })});
      await refresh();
    } catch (e) {
      console.error('Approve failed:', e);
    }
  }
  async function deny(id: string) {
    try {
      await fetch('/api/guardrails/params/deny', { method: 'POST', headers, body: JSON.stringify({ id, reason: 'ui' })});
      await refresh();
    } catch (e) {
      console.error('Deny failed:', e);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Param Review</h1>
      <button onClick={refresh} className="px-3 py-2 rounded bg-gray-200">Yenile</button>
      <div className="grid gap-2">
        {rows.map(r => (
          <div key={r.id} className="p-3 rounded border">
            <div className="font-mono text-sm">{r.key}</div>
            <div className="text-xs opacity-70">old: {JSON.stringify(r.oldVal)} → new: {JSON.stringify(r.newVal)}</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => approve(r.id)} className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>
              <button onClick={() => deny(r.id)} className="px-3 py-1 rounded bg-red-600 text-white">Deny</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="opacity-60 text-sm">Pending yok.</div>}
      </div>
    </div>
  );
}
