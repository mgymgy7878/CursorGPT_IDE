import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { ClientDateTime } from "@/components/ui/ClientDateTime";
import { OptimisticPositionsTable } from "@/components/portfolio/OptimisticPositionsTable";
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { t } from '@/lib/i18n';

function ExchangeStatus() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-xs">B</span>
          </div>
          <div>
            <div className="font-medium">Binance</div>
            <div className="text-xs text-neutral-400">{t('status.connected')}</div>
          </div>
        </div>
        <div className="px-2 py-1 text-xs bg-green-900 text-green-300 rounded">
          {t('status.online')}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">API Status</span>
          <span className="text-green-400">✓ {t('status.active')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Last Sync</span>
          <span className="text-neutral-300">
            <ClientDateTime date={new Date(Date.now() - 120000)} format="relative" />
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Rate Limit</span>
          <span className="text-neutral-300">1200/1200</span>
        </div>
      </div>
    </div>
  );
}

function LivePnL() {
  const pnl24h = 1247.50;
  const totalBalance = 12847.50;
  const available = 8500.00;
  const inOrders = 4347.50;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 
          className={`text-2xl font-bold num-tight ${pnl24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          aria-live="polite"
          aria-atomic="true">
          {pnl24h >= 0 ? '+' : ''}{formatCurrency(pnl24h, 'tr-TR', 'USD')}
        </h3>
        <div className="text-sm text-neutral-400">24 saat P&L</div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Toplam Bakiye</span>
          <span className="text-white num-tight">{formatCurrency(totalBalance, 'tr-TR', 'USD')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Kullanılabilir</span>
          <span className="text-white num-tight">{formatCurrency(available, 'tr-TR', 'USD')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Emirde</span>
          <span className="text-white num-tight">{formatCurrency(inOrders, 'tr-TR', 'USD')}</span>
        </div>
      </div>
    </div>
  );
}


export default function Portfolio() {
  return (
    <AppShell>
      <PageHeader
        title="Portföy"
        subtitle="Canlı pozisyonlar, PnL ve borsa durumu"
      />
      
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card title="Borsa Bağlantısı">
          <ExchangeStatus />
        </Card>

        <Card title="Toplam PnL (canlı)">
          <LivePnL />
        </Card>

        <Card title="Hesap Özeti">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-neutral-400">Toplam Bakiye</div>
                <div className="text-lg font-semibold num-tight">{formatCurrency(12847.50, 'tr-TR', 'USD')}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Kullanılabilir</div>
                <div className="text-lg font-semibold num-tight">{formatCurrency(8500.00, 'tr-TR', 'USD')}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Açık Pozisyonlar" className="sm:col-span-2 xl:col-span-3">
          <OptimisticPositionsTable />
        </Card>
      </div>
    </AppShell>
  );
}