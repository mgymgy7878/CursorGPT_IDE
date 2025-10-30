"use client";
import { useState } from "react";
import IconButton from "@/components/ui/IconButton";
import { toast } from "@/components/toast/Toaster";
import { formatCurrency } from "@/lib/format";

type Position = {
  asset: string;
  amount: number;
  price: number;
  pnl: number;
  pnlPercent: string;
};

export function OptimisticPositionsTable() {
  const [positions, setPositions] = useState<Position[]>([
    {
      asset: "BTCUSDT",
      amount: 0.25,
      price: 42500,
      pnl: 125.50,
      pnlPercent: "+2.1%",
    },
    {
      asset: "ETHUSDT",
      amount: 2.5,
      price: 2650,
      pnl: -45.20,
      pnlPercent: "-1.2%",
    },
    {
      asset: "ADAUSDT",
      amount: 1000,
      price: 0.52,
      pnl: 23.80,
      pnlPercent: "+3.8%",
    },
  ]);

  const [pending, setPending] = useState<Record<string, boolean>>({});

  // Calculate totals
  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPnlPercent = positions.length > 0
    ? positions.reduce((sum, pos) => sum + parseFloat(pos.pnlPercent), 0) / positions.length
    : 0;

  const handleClose = async (asset: string) => {
    // Optimistic UI: immediately mark as pending
    setPending({ ...pending, [asset]: true });

    toast({
      type: "info",
      title: "İşlem Kapanıyor",
      description: `${asset} pozisyonu kapatılıyor...`,
    });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success: remove from list
      setPositions(positions.filter((p) => p.asset !== asset));
      setPending({ ...pending, [asset]: false });

      toast({
        type: "success",
        title: "İşlem Kapatıldı",
        description: `${asset} pozisyonu başarıyla kapatıldı.`,
      });
    } catch (error) {
      // Rollback on error
      setPending({ ...pending, [asset]: false });

      toast({
        type: "error",
        title: "İşlem Başarısız",
        description: `${asset} pozisyonu kapatılamadı. Lütfen tekrar deneyin.`,
      });
    }
  };

  const handleReverse = async (asset: string) => {
    // Optimistic UI
    setPending({ ...pending, [`${asset}-reverse`]: true });

    toast({
      type: "info",
      title: "Pozisyon Tersine Çevriliyor",
      description: `${asset} pozisyonu tersine çevriliyor...`,
    });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success
      setPending({ ...pending, [`${asset}-reverse`]: false });

      toast({
        type: "success",
        title: "Pozisyon Tersine Çevrildi",
        description: `${asset} pozisyonu başarıyla tersine çevrildi.`,
      });
    } catch (error) {
      // Rollback
      setPending({ ...pending, [`${asset}-reverse`]: false });

      toast({
        type: "error",
        title: "İşlem Başarısız",
        description: `${asset} pozisyonu tersine çevrilemedi.`,
      });
    }
  };

  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        Açık pozisyon bulunmuyor
      </div>
    );
  }

  return (
    <div className="overflow-x-auto table-wrapper">
      <table className="w-full">
        <thead className="sticky top-0 bg-card z-10">
          <tr className="border-b border-neutral-700 row-sm">
            <th className="text-left py-2 px-2 text-xs font-medium text-mute uppercase tracking-wide">
              Varlık
            </th>
            <th className="text-right py-2 px-2 text-xs font-medium text-mute uppercase tracking-wide">
              Miktar
            </th>
            <th className="text-right py-2 px-2 text-xs font-medium text-mute uppercase tracking-wide">
              Fiyat
            </th>
            <th className="text-right py-2 px-2 text-xs font-medium text-mute uppercase tracking-wide">
              PnL $
            </th>
            <th className="text-right py-2 px-2 text-xs font-medium text-mute uppercase tracking-wide">
              PnL %
            </th>
            <th className="text-right py-2 px-2 text-xs font-medium text-mute uppercase tracking-wide">
              Aksiyon
            </th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr
              key={position.asset}
              className={`border-b border-neutral-800 row-sm transition-opacity hover:bg-zinc-900/30 ${
                pending[position.asset] ? "opacity-50" : ""
              }`}
            >
              <td className="py-2 px-2">
                <div className="font-medium text-sm text-strong">{position.asset}</div>
              </td>
              <td className="py-2 px-2 text-right text-sm tabular whitespace-nowrap text-neutral-300">{position.amount}</td>
              <td className="py-2 px-2 text-right text-sm tabular whitespace-nowrap text-neutral-300">{formatCurrency(position.price, 'tr-TR', 'USD')}</td>
              <td
                className={`py-2 px-2 text-right text-sm tabular whitespace-nowrap ${
                  position.pnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl, 'tr-TR', 'USD')}
              </td>
              <td
                className={`py-2 px-2 text-right text-sm tabular whitespace-nowrap ${
                  position.pnlPercent.startsWith("+")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {position.pnlPercent}
              </td>
              <td className="py-2 px-2">
                <div className="flex gap-1 justify-end">
                    <IconButton
                      icon="SquareX"
                      title="Pozisyonu Kapat"
                      variant="danger"
                      onClick={() => handleClose(position.asset)}
                      disabled={pending[position.asset]}
                    />
                    <IconButton
                      icon="ArrowLeftRight"
                      title="Ters Pozisyon Aç"
                      variant="neutral"
                      onClick={() => handleReverse(position.asset)}
                      disabled={pending[`${position.asset}-reverse`]}
                    />
                </div>
              </td>
            </tr>
          ))}
                </tbody>
              </table>

              {/* Total PnL Row */}
              <div className="mt-4 pt-3 border-t border-neutral-700">
                <div className="flex justify-end gap-8 text-sm">
                  <div className="text-right">
                    <div className="text-xs text-mute uppercase tracking-wide">Toplam PnL $</div>
                    <div className={`font-semibold tabular ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl, 'tr-TR', 'USD')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-mute uppercase tracking-wide">Toplam PnL %</div>
                    <div className={`font-semibold tabular ${totalPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
  );
}

