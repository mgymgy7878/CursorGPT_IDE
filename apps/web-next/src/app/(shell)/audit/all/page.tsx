'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ClientTime } from '@/components/common/ClientTime';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AllAuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [integrity, setIntegrity] = useState<{ verified: boolean; message?: string; brokenAtIndex?: number } | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadMore = async (nextCursor: string | null = null) => {
    if (loading) return;

    setLoading(true);
    try {
      const url = new URL('/api/audit/list', window.location.origin);
      url.searchParams.set('limit', '50');
      if (nextCursor) {
        url.searchParams.set('cursor', nextCursor);
      }

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          if (nextCursor) {
            setLogs(prev => [...prev, ...data.items]);
          } else {
            setLogs(data.items);
          }

          setCursor(data.nextCursor);
          setHasMore(data.hasMore || false);
        }
      }
    } catch (e) {
      console.error('Error loading audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  // Check integrity on mount
  useEffect(() => {
    const checkIntegrity = async () => {
      try {
        const res = await fetch('/api/audit/verify?limit=200', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setIntegrity({
            verified: data.verified || false,
            message: data.message,
            brokenAtIndex: data.brokenAtIndex || undefined,
          });
        }
      } catch (e) {
        console.error('Error checking integrity:', e);
      }
    };

    checkIntegrity();
  }, []);

  useEffect(() => {
    loadMore();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/audit/export?limit=1000', { cache: 'no-store' });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.jsonl`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Error exporting:', e);
      alert('Export başarısız oldu');
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageContainer size="wide">
      <div className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Tüm Audit Logları"
            subtitle={`${logs.length} kayıt listeleniyor`}
          />
          <div className="flex items-center gap-3">
            {integrity && (
              <div className="flex items-center gap-2" title={integrity.message || ''}>
                <Badge variant={integrity.verified ? 'success' : 'destructive'}>
                  {integrity.verified ? 'Integrity OK' : `BROKEN @ index ${integrity.brokenAtIndex ?? '?'}`}
                </Badge>
              </div>
            )}
            <button
              onClick={handleExport}
              disabled={exporting}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                exporting
                  ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              )}
            >
              {exporting ? 'İndiriliyor...' : 'Export (JSONL)'}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-800/50 border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400">Zaman</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400">Aktör</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400">Aksiyon</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {logs.map((log) => {
                  const status = log.action.includes('error') || log.action.includes('failed') ? 'error'
                    : log.action.includes('warn') ? 'warn'
                    : 'ok';

                  return (
                    <tr key={log.auditId || log.id} className="hover:bg-neutral-900/50">
                      <td className="px-4 py-2 text-xs text-neutral-300">
                        <ClientTime value={log.time || log.timestamp} format="relative" />
                      </td>
                      <td className="px-4 py-2 text-xs text-neutral-400">{log.actor}</td>
                      <td className="px-4 py-2 text-xs">
                        <span className={cn(
                          'px-2 py-0.5 rounded',
                          status === 'error' ? 'bg-red-500/20 text-red-400' :
                          status === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-neutral-500">
                        {JSON.stringify(log.payload || {}).slice(0, 50)}...
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => cursor && loadMore(cursor)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
            >
              {loading ? 'Yükleniyor...' : 'Daha fazla yükle'}
            </button>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Geri dön
          </button>
        </div>
      </div>
    </PageContainer>
  );
}

