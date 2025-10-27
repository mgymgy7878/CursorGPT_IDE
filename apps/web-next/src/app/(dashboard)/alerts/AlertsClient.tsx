"use client";
import useSWR from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function AlertsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = searchParams.get('level') || '';
  const source = searchParams.get('source') || '';

  const { data } = useSWR('/api/alerts/list', fetcher, {
    refreshInterval: 10000,
  });

  const allRows = data?.items ?? [];
  const rows = allRows.filter(
    (r: any) => (!level || r.level === level) && (!source || r.source === source)
  );

  function updateFilter(key: 'level' | 'source', val: string) {
    const params = new URLSearchParams();
    if (key === 'level' && val) params.set('level', val);
    else if (level) params.set('level', level);
    if (key === 'source' && val) params.set('source', val);
    else if (source) params.set('source', source);
    router.push(`/alerts?${params.toString()}`);
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Uyarılar</h2>
        <div className="text-sm text-gray-500">
          {rows.length} / {allRows.length} uyarı
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <select value={level} onChange={(e) => updateFilter('level', e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
          <option value="">Tüm Seviyeler</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select value={source} onChange={(e) => updateFilter('source', e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
          <option value="">Tüm Kaynaklar</option>
          <option value="optimizer">Optimizer</option>
          <option value="ml-engine">ML Engine</option>
          <option value="executor">Executor</option>
          <option value="streams">Streams</option>
        </select>
      </div>

      <div className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white border-b">
            <tr className="text-left text-gray-500">
              <th className="py-3 px-4">Zaman</th>
              <th className="py-3 px-4">Seviye</th>
              <th className="py-3 px-4">Kaynak</th>
              <th className="py-3 px-4">Mesaj</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="py-8 px-4 text-gray-400 text-center" colSpan={4}>🎉 Uyarı yok</td>
              </tr>
            )}
            {rows.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="py-3 px-4">{new Date(r.ts).toLocaleString('tr-TR')}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.level === 'critical' ? 'bg-red-100 text-red-700' : r.level === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {r.level}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-xs">{r.source}</td>
                <td className="py-3 px-4">{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


