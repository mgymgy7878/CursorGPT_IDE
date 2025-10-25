'use client';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function ErrorBudgetBadge() {
  const { data } = useSWR('/api/public/error-budget', fetcher, { refreshInterval: 15000 });
  const pct = Math.max(0, Math.min(100, Number(data?.remaining_pct ?? 0)));
  const color = pct >= 60 ? 'bg-green-600' : pct >= 30 ? 'bg-yellow-600' : 'bg-red-600';
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded-md text-white text-xs ${color}`} 
      title={`Error rate ${((data?.error_rate ?? 0) * 100).toFixed(3)}% / allowed ${((data?.allowed ?? 0) * 100).toFixed(1)}%`}
    >
      EB {pct.toFixed(1)}%
    </span>
  );
}

