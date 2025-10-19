"use client";
export const dynamic = 'force-dynamic';
import AuditTable from '@/components/audit/AuditTable';
import AuditFilters from '@/components/audit/AuditFilters';
import { useAuditLogs } from '@/hooks/useAuditLogs';

export default function Page() {
  return (
    <section className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      <ClientAudit />
    </section>
  );
}

function ClientAudit() {
  const { items, list, loading, total } = useAuditLogs('/api/public/audit-mock');
  return (
    <div className="space-y-3">
      <AuditFilters onChange={(q)=>list({ ...q, page:1, size:50 })} />
      {loading ? <div>Loading…</div> : <AuditTable rows={items} />}
      <div className="text-xs opacity-70">Total: {total}</div>
    </div>
  );
}
