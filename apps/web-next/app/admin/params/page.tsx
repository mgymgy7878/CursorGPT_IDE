import { assertAdmin } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

async function api(path: string, init?: RequestInit) {
  const r = await fetch(`/api/guardrails/${path}`, { cache: 'no-store', ...(init || {}) });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

async function getPending() {
  const res = await api('params/pending');
  return res.items || [];
}

export default async function Page() {
  // RBAC (header temelli stub); gerçek uygulamada session'dan bakılacak
  // @ts-expect-error headers is available in server component runtime
  assertAdmin(headers());

  const pending = await getPending();

  async function approve(strategy: string) {
    'use server';
    await api('params/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Actor': 'web' },
      body: JSON.stringify({ strategy }),
    });
  }
  
  async function deny(strategy: string) {
    'use server';
    await api('params/deny', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Actor': 'web' },
      body: JSON.stringify({ strategy }),
    });
  }

  // Client bileşenlerini dinamik import
  const PendingTable = (await import('@/components/params/PendingTable')).default;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Param Review</h1>
      <PendingTable initialItems={pending} onApprove={approve} onDeny={deny} />
    </div>
  );
}
