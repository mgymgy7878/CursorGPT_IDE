"use client";
export const dynamic = 'force-dynamic';
import AuditTable from '@/components/audit/AuditTable';
import AuditFilters from '@/components/audit/AuditFilters';
import TableSkeleton from '@/components/ui/TableSkeleton';
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
      {/* P0.4 Fix: Table skeleton while loading */}
      {loading ? (
        <TableSkeleton
          rows={10}
          headers={["Actor", "Action", "Resource", "Status", "Timestamp"]}
          showCount
          countLabel={`Total: ${total}`}
        />
      ) : (
        <>
          <AuditTable rows={items} />
          <div className="text-sm text-neutral-400 px-1">Total: {total}</div>
        </>
      )}
    </div>
  );
}
