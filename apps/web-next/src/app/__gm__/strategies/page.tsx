/**
 * Golden Master Strategies Route
 *
 * Statik mock data ile deterministik screenshot testleri için.
 */

import MyStrategiesPage from '@/components/strategies/MyStrategiesPage';
import AppFrame from '@/components/layout/AppFrame';

export const dynamic = 'force-dynamic';

export default function GoldenMasterStrategiesPage() {
  return (
    <AppFrame>
      <MyStrategiesPage />
    </AppFrame>
  );
}

