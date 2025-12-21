import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientDateTime } from "@/components/ui/ClientDateTime";
import { OptimisticPositionsTable } from "@/components/portfolio/OptimisticPositionsTable";
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { t } from '@/lib/i18n';

function ExchangeStatus() {
  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center justify-between min-w-0 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs">B</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">Binance</div>
            <div className="text-xs text-neutral-400 truncate">{t('status.connected')}</div>
          </div>
        </div>
        <div className="px-2 py-1 text-xs bg-green-900 text-green-300 rounded shrink-0 whitespace-nowrap">
          {t('status.online')}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm gap-2 min-w-0">
          <span className="text-neutral-400 shrink-0">API Status</span>
          <span className="text-green-400 shrink-0 whitespace-nowrap">✓ {t('status.active')}</span>
        </div>
        <div className="flex justify-between text-sm gap-2 min-w-0">
          <span className="text-neutral-400 shrink-0">Last Sync</span>
          <span className="text-neutral-300 shrink-0 whitespace-nowrap">
            <ClientDateTime date={new Date(Date.now() - 120000)} format="relative" />
          </span>
        </div>
        <div className="flex justify-between text-sm gap-2 min-w-0">
          <span className="text-neutral-400 shrink-0">Rate Limit</span>
          <span className="text-neutral-300 shrink-0 tabular-nums whitespace-nowrap">1200/1200</span>
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
          className={`text-2xl font-bold tabular-nums ${pnl24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          aria-live="polite"
          aria-atomic="true">
          {pnl24h >= 0 ? '+' : ''}{formatCurrency(pnl24h, 'USD')}
        </h3>
        <div className="text-sm text-neutral-400">24 saat P&L</div>
      </div>

      {/* P1 FIX: grid ile label/value hizası - gap-3 ile "sıkışık" hissi önlenir */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto] gap-3 text-sm min-w-0">
          <span className="text-neutral-400 truncate">Toplam Bakiye</span>
          <span className="text-white tabular-nums whitespace-nowrap">{formatCurrency(totalBalance, 'USD')}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3 text-sm min-w-0">
          <span className="text-neutral-400 truncate">Kullanılabilir</span>
          <span className="text-white tabular-nums whitespace-nowrap">{formatCurrency(available, 'USD')}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3 text-sm min-w-0">
          <span className="text-neutral-400 truncate">Emirde</span>
          <span className="text-white tabular-nums whitespace-nowrap">{formatCurrency(inOrders, 'USD')}</span>
        </div>
      </div>
    </div>
  );
}


export default function Portfolio() {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Portföy"
        subtitle="Canlı pozisyonlar, PnL ve borsa durumu"
      />

      {/* P0 FIX: Sol kart için min-width ile overlap önleme */}
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Borsa Bağlantısı</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ExchangeStatus />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Toplam PnL (canlı)</CardTitle>
          </CardHeader>
          <CardContent>
            <LivePnL />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hesap Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-400">Toplam Bakiye</div>
                  <div className="text-lg font-semibold num-tight text-neutral-200">{formatCurrency(12847.50, 'USD')}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Kullanılabilir</div>
                  <div className="text-lg font-semibold num-tight text-neutral-200">{formatCurrency(8500.00, 'USD')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Açık Pozisyonlar</CardTitle>
          </CardHeader>
          <CardContent>
            <OptimisticPositionsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
