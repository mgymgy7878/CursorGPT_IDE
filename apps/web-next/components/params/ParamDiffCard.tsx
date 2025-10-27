'use client';
import { useMemo } from 'react';

type Diff = Record<string, { from: any, to: any }>;

export default function ParamDiffCard({ strategy, diff }: { strategy: string; diff: Diff }) {
  const entries = useMemo(() => Object.entries(diff), [diff]);
  
  if (!entries.length) return (
    <div className="border rounded-2xl p-4 text-sm">No changes</div>
  );
  
  return (
    <div className="border rounded-2xl p-4">
      <div className="font-semibold mb-2">Diff — {strategy}</div>
      <ul className="space-y-2">
        {entries.map(([k, v]) => (
          <li key={k} className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-mono">{k}</div>
            <div className="col-span-1 break-all">{JSON.stringify(v.from)}</div>
            <div className="col-span-1 break-all">{JSON.stringify(v.to)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
