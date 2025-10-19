'use client';
import { AuditItem } from '@/hooks/useAuditLogs';

export default function AuditTable({ rows }: { rows: AuditItem[] }) {
  return (
    <div className="w-full overflow-auto rounded-2xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100">
          <tr className="text-left">
            <th className="p-3">Time</th>
            <th className="p-3">Actor</th>
            <th className="p-3">Action</th>
            <th className="p-3">Target</th>
            <th className="p-3">Status</th>
            <th className="p-3">Audit ID</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.auditId} className="border-t">
              <td className="p-3 whitespace-nowrap">{new Date(r.time).toLocaleString()}</td>
              <td className="p-3">{r.actor}</td>
              <td className="p-3">{r.action}</td>
              <td className="p-3">{r.target ?? '-'}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs ${
                  r.status==='ok'?'bg-green-100':
                  r.status==='warn'?'bg-yellow-100':'bg-red-100'}`}>
                  {r.status}
                </span>
              </td>
              <td className="p-3 font-mono text-xs">{r.auditId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}