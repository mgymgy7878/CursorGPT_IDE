'use client';
import { useCallback, useState } from 'react';

export type AuditItem = {
  time: string; 
  actor: string; 
  action: string; 
  target?: string;
  status: 'ok'|'warn'|'error'; 
  auditId: string;
};

export type AuditQuery = { 
  actor?: string; 
  action?: string; 
  q?: string; 
  from?: string; 
  to?: string; 
  page?: number; 
  size?: number 
};

export function useAuditLogs(base = (process.env.NEXT_PUBLIC_USE_MOCK === '1'
  ? '/api/public/audit-mock'
  : (process.env.NEXT_PUBLIC_API_BASE ? `${process.env.NEXT_PUBLIC_API_BASE}/api/audit/list` : '/api/audit/list'))
) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);

  const list = useCallback(async (q: AuditQuery = {}) => {
    setLoading(true);
    try {
      const url = new URL(base, location.origin);
      Object.entries(q).forEach(([k, v]) => (v !== undefined && v !== '') && url.searchParams.set(k, String(v)));
      let r = await fetch(url.toString(), { cache: 'no-store' });
      if (!r.ok) {
        // fallback to mock
        const mockUrl = new URL('/api/public/audit-mock', location.origin);
        Object.entries(q).forEach(([k, v]) => (v !== undefined && v !== '') && mockUrl.searchParams.set(k, String(v)));
        r = await fetch(mockUrl.toString(), { cache: 'no-store' });
      }
      const data = await r.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? data.items?.length ?? 0);
    } finally { setLoading(false); }
  }, [base]);

  return { loading, items, total, list };
}