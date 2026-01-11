import { Card } from '@/components/ui/card';

export function DashboardGrid() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">Bugünkü P&L</h2>
        <p className="text-2xl font-bold text-success">+$245,80</p>
        <div className="mt-2 space-y-1 text-sm">
          <p>Max DD (30g): -8.5%</p>
          <p>Vol (30g): 12.3%</p>
          <p>Varlık: 9 adet</p>
        </div>
      </Card>
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">Top 5 Varlık</h2>
        <ul className="space-y-2">
          <li>BTCUSDT: 45%, +$180,50</li>
          <li>ETHUSDT: 28%, +$45,20</li>
          <li>BNBUSDT: 15%, +$12,10</li>
          <li>SOLUSDT: 8%, +$5,50</li>
          <li>ADAUSDT: 4%, +$2,50</li>
        </ul>
      </Card>
      <Card className="p-4 lg:col-span-2">
        <h2 className="text-lg font-semibold mb-2">Canlı Haber</h2>
        <ul className="space-y-2">
          <li>CoinDesk: BTC fon akışları yükseldi (12dk önce)</li>
          <li>CryptoNews: ETH staking ödülleri arttı (23dk önce)</li>
          <li>KAPMAVI: Bilanço açıklandı (5dk önce)</li>
        </ul>
      </Card>
    </section>
  );
}

