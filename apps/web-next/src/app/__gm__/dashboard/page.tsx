/**
 * Golden Master Dashboard Route
 *
 * Statik mock data ile deterministik screenshot testleri için.
 * Network bağımlılığı yok, animasyonlar kapalı, tarih/saat sabit.
 */

import DashboardGrid from '@/components/dashboard/DashboardGrid';
import AppFrame from '@/components/layout/AppFrame';

export const dynamic = 'force-dynamic';

export default function GoldenMasterDashboardPage() {
  return (
    <AppFrame>
      <div className="p-6">
        <DashboardGrid />
      </div>
    </AppFrame>
  );
}

