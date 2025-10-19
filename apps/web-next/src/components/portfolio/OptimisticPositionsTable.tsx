"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
        <thead>
          <tr className="border-b border-neutral-700">
            <th className="text-left py-3 px-2 text-sm font-medium text-neutral-400">
              Varlık
            </th>
            <th className="text-right py-3 px-2 text-sm font-medium text-neutral-400">
              Miktar
            </th>
            <th className="text-right py-3 px-2 text-sm font-medium text-neutral-400">
              Fiyat (USD)
            </th>
            <th className="text-right py-3 px-2 text-sm font-medium text-neutral-400">
              PnL (USD)
            </th>
            <th className="text-right py-3 px-2 text-sm font-medium text-neutral-400">
              PnL %
            </th>
            <th className="text-center py-3 px-2 text-sm font-medium text-neutral-400">
              Aksiyon
            </th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr
              key={position.asset}
              className={`border-b border-neutral-800 transition-opacity ${
                pending[position.asset] ? "opacity-50" : ""
              }`}
            >
              <td className="py-3 px-2">
                <div className="font-medium strategy-name">{position.asset}</div>
              </td>
              <td className="py-3 px-2 text-right text-sm num-tight">{position.amount}</td>
              <td className="py-3 px-2 text-right text-sm num-tight">{formatCurrency(position.price, 'tr-TR', 'USD')}</td>
              <td
                className={`py-3 px-2 text-right text-sm num-tight ${
                  position.pnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl, 'tr-TR', 'USD')}
              </td>
              <td
                className={`py-3 px-2 text-right text-sm num-tight ${
                  position.pnlPercent.startsWith("+")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {position.pnlPercent}
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleClose(position.asset)}
                    disabled={pending[position.asset]}
                  >
                    {pending[position.asset] ? "Kapatılıyor..." : "Pozisyonu Kapat"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReverse(position.asset)}
                    disabled={pending[`${position.asset}-reverse`]}
                  >
                    {pending[`${position.asset}-reverse`]
                      ? "Çevriliyor..."
                      : "Ters Pozisyon Aç"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

