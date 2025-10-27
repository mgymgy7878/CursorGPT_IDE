export const revalidate = false;
export const dynamic = 'force-dynamic';

import { getPortfolioSummary } from '@/lib/api/portfolio';
import { Accounts, Assets } from '@/components/portfolio/PortfolioTable';

export default async function PortfolioPage(){
  const data = await getPortfolioSummary();
  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Portföy</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 font-medium">Hesaplar</h2>
          <Accounts rows={data.accounts} />
        </section>
        <section>
          <h2 className="mb-2 font-medium">Varlık Dağılımı</h2>
          <Assets rows={data.byAsset} />
        </section>
      </div>
    </div>
  );
}
