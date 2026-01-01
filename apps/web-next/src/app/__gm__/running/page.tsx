/**
 * Golden Master Running Strategies Route
 *
 * Statik mock data ile deterministik screenshot testleri için.
 */

import RunningStrategiesPage from '@/components/strategies/RunningStrategiesPage';
import AppFrame from '@/components/layout/AppFrame';

export const dynamic = 'force-dynamic';

export default function GoldenMasterRunningPage() {
  return (
    <AppFrame>
      <RunningStrategiesPage />
    </AppFrame>
  );
}

