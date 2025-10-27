"use client";
import useSWR from "swr";
import { useMemo, useState } from "react";
import type { PortfolioResponse, PortfolioAccount } from "@/types/portfolio";
import ExchangeTabs from "@/components/portfolio/ExchangeTabs";
import PortfolioTable from "@/components/portfolio/PortfolioTable";
import AllocationDonut from "@/components/portfolio/AllocationDonut";
import SummaryCards from "@/components/portfolio/SummaryCards";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function PortfolioPage() {
  const { data, isLoading, mutate } = useSWR<PortfolioResponse>("/api/portfolio", fetcher, { refreshInterval: 60000 });
  const accounts = data?.accounts || [];
  const [active, setActive] = useState<string>(accounts[0]?.exchange || "binance");

  const activeAcc: PortfolioAccount | undefined = useMemo(
    () => accounts.find((a) => a.exchange === active) || accounts[0],
    [accounts, active]
  );

  const totalUsd = useMemo(
    () => accounts.reduce((s, a) => s + (a.totals?.totalUsd || 0), 0),
    [accounts]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Portföy</h1>
          <p className="text-sm opacity-70">Bağlı borsalardaki varlıklarınızın birleşik görünümü.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="rounded-xl border px-3 py-2">Yenile</button>
        </div>
      </div>

      <SummaryCards totalUsd={totalUsd} accountCount={accounts.length} updatedAt={data?.updatedAt} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-10 rounded-2xl border animate-pulse" />
          <div className="h-10 rounded-2xl border animate-pulse" />
          <div className="h-10 rounded-2xl border animate-pulse" />
          <div className="h-[320px] rounded-2xl border animate-pulse sm:col-span-2" />
          <div className="h-[320px] rounded-2xl border animate-pulse" />
        </div>
      ) : accounts.length ? (
        <>
          <div className="flex items-center justify-between">
            <ExchangeTabs accounts={accounts} active={activeAcc?.exchange || active} onChange={setActive} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PortfolioTable rows={activeAcc?.balances || []} />
            </div>
            <AllocationDonut rows={(activeAcc?.balances || []).filter(b=> (b.valueUsd ?? 0) > 0)} />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border p-10 text-center">
          <h3 className="text-lg font-semibold">Hiç hesap bağlı değil</h3>
          <p className="opacity-70">Ayarlar'dan borsa API anahtarlarınızı ekleyin.</p>
        </div>
      )}
    </div>
  );
}
