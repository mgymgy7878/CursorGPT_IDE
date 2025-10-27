export const dynamic = "force-dynamic";
export const revalidate = 0;
import { Suspense } from 'react';
import AlertsClient from './AlertsClient';

export default function AlertsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Yükleniyor…</div>}>
      <AlertsClient />
    </Suspense>
  );
}

