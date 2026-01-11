'use client';
import { AuditItem } from '@/hooks/useAuditLogs';
import { DataTable, DataTableHeader, DataTableRow, DataTableCell, DataTableHeaderCell } from '@/components/ui/DataTable';
import { badgeVariant } from '@/styles/uiTokens';
import { cn } from '@/lib/utils';
import { ClientTime } from '@/components/common/ClientTime';

// Category icons mapping - Figma parity
const getCategoryIcon = (category: string) => {
  const cat = category.toUpperCase();
  if (cat.includes('SYSTEM')) return '🖥️';
  if (cat.includes('MARKET')) return '📊';
  if (cat.includes('STRATEGY') || cat.includes('AI')) return '🧠';
  if (cat.includes('TRADE')) return '💱';
  if (cat.includes('RISK')) return '⚠️';
  return '📋';
};

export default function AuditTable({ rows }: { rows: AuditItem[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <DataTable>
        <DataTableHeader>
          <DataTableRow hover={false}>
            <DataTableHeaderCell>ZAMAN</DataTableHeaderCell>
            <DataTableHeaderCell>KATEGORI</DataTableHeaderCell>
            <DataTableHeaderCell>KAYNAK</DataTableHeaderCell>
            <DataTableHeaderCell>MESAJ</DataTableHeaderCell>
            <DataTableHeaderCell>ÖNEM</DataTableHeaderCell>
            <DataTableHeaderCell>Audit ID</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHeader>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12">
                <div className="text-center space-y-4">
                  <div className="text-4xl mb-2">📋</div>
                  <div className="text-lg font-medium text-neutral-200">Henüz log kaydı yok</div>
                  <div className="text-sm text-neutral-400 max-w-md mx-auto mb-4">
                    Sistem kararları, AI sinyalleri ve işlem kayıtları burada görünecek
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                    <a
                      href="/canary"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
                    >
                      Canary Test Çalıştır
                    </a>
                    <span className="text-xs text-neutral-500">veya</span>
                    <a
                      href="/technical-analysis"
                      className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-neutral-200 transition-colors"
                    >
                      Sample Data Seed
                    </a>
                  </div>
                  <div className="text-xs text-neutral-500 mt-2">
                    Log üretmek için: Canary Test çalıştır veya Sample Data Seed kullan
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            rows.map(r => {
              const category = r.action || 'UNKNOWN';
              const icon = getCategoryIcon(category);

              return (
                <DataTableRow key={r.auditId}>
                  <DataTableCell className="whitespace-nowrap font-mono text-xs text-neutral-300">
                    <ClientTime value={r.time} />
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="text-xs font-medium text-neutral-300">{category}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-neutral-300 text-xs">{r.actor || '-'}</DataTableCell>
                  <DataTableCell className="text-neutral-200 text-xs max-w-md truncate">
                    {r.action || '-'}
                  </DataTableCell>
                  <DataTableCell>
                    <span className={cn(
                      badgeVariant(
                        r.status === 'ok' ? 'success' :
                        r.status === 'warn' ? 'warning' : 'default'
                      )
                    )}>
                      {r.status === 'ok' ? 'INFO' : r.status === 'warn' ? 'WARN' : 'ERROR'}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="font-mono text-xs text-neutral-400">{r.auditId?.slice(0, 8) || '-'}</DataTableCell>
                </DataTableRow>
              );
            })
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
