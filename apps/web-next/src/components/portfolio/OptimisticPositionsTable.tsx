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
    <div
      className="table-wrapper min-h-0"
      style={{
        maxHeight: 'calc(100vh - 260px)',
        overflow: 'auto',
      }}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-700">
            <th className="text-left px-2 text-sm font-medium text-neutral-400" style={{ paddingTop: 'var(--table-head-py, 8px)', paddingBottom: 'var(--table-head-py, 8px)' }}>
              Varlık
            </th>
            <th className="text-right px-2 text-sm font-medium text-neutral-400 tabular-nums" style={{ paddingTop: 'var(--table-head-py, 8px)', paddingBottom: 'var(--table-head-py, 8px)' }}>
              Miktar
            </th>
            <th className="text-right px-2 text-sm font-medium text-neutral-400 tabular-nums" style={{ paddingTop: 'var(--table-head-py, 8px)', paddingBottom: 'var(--table-head-py, 8px)' }}>
              Fiyat (USD)
            </th>
            <th className="text-right px-2 text-sm font-medium text-neutral-400 tabular-nums" style={{ paddingTop: 'var(--table-head-py, 8px)', paddingBottom: 'var(--table-head-py, 8px)' }}>
              PnL (USD)
            </th>
            <th className="text-right px-2 text-sm font-medium text-neutral-400 tabular-nums" style={{ paddingTop: 'var(--table-head-py, 8px)', paddingBottom: 'var(--table-head-py, 8px)' }}>
              PnL %
            </th>
            <th className="text-center px-2 text-sm font-medium text-neutral-400" style={{ paddingTop: 'var(--table-head-py, 8px)', paddingBottom: 'var(--table-head-py, 8px)' }}>
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
              <td className="px-2" style={{ paddingTop: 'var(--table-row-py, 8px)', paddingBottom: 'var(--table-row-py, 8px)' }}>
                <div className="font-medium strategy-name">{position.asset}</div>
              </td>
              <td className="px-2 text-right text-sm tabular-nums">{position.amount}</td>
              <td className="px-2 text-right text-sm tabular-nums">{formatCurrency(position.price, 'USD')}</td>
              <td
                className={`px-2 text-right text-sm tabular-nums ${
                  position.pnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
                style={{ paddingTop: 'var(--table-row-py, 8px)', paddingBottom: 'var(--table-row-py, 8px)' }}
              >
                {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl, 'USD')}
              </td>
              <td
                className={`px-2 text-right text-sm tabular-nums ${
                  position.pnlPercent.startsWith("+")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
                style={{ paddingTop: 'var(--table-row-py, 8px)', paddingBottom: 'var(--table-row-py, 8px)' }}
              >
                {position.pnlPercent}
              </td>
              <td className="px-2 text-center" style={{ paddingTop: 'var(--table-row-py, 8px)', paddingBottom: 'var(--table-row-py, 8px)' }}>
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

