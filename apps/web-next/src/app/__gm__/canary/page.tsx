'use client';

import AppFrame from '@/components/layout/AppFrame';
import CanaryPage from '@/app/(shell)/canary/page';

export const dynamic = 'force-dynamic';

export default function GoldenMasterCanaryPage() {
  return (
    <AppFrame>
      <CanaryPage />
    </AppFrame>
  );
}

