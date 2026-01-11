'use client';

import AppFrame from '@/components/layout/AppFrame';
import RiskProtectionPage from '@/components/guardrails/RiskProtectionPage';

export const dynamic = 'force-dynamic';

export default function GoldenMasterGuardrailsPage() {
  return (
    <AppFrame>
      <RiskProtectionPage />
    </AppFrame>
  );
}

