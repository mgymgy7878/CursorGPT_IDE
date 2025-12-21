import { Suspense } from 'react';
import DashboardWrapper from '@/components/dashboard/DashboardWrapper';

export const dynamic = 'force-dynamic';

// SSR-safe dev state resolver (production'da otomatik pasif)
function resolveDevState(state?: string | null): 'loading' | 'empty' | 'error' | 'data' | null {
  // Production'da dev toggle pasif
  if (process.env.NODE_ENV === 'production') return null;

  if (state === 'loading' || state === 'empty' || state === 'error' || state === 'data') {
    return state;
  }
  return null;
}

interface DashboardPageProps {
  searchParams: Promise<{ state?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  // Dev toggle: ?state=loading|empty|error (GIF çekmek ve regression test için)
  const devState = resolveDevState(params?.state);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardWrapper devState={devState} />
    </Suspense>
  );
}

