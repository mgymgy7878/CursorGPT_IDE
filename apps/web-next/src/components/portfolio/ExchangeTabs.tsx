"use client";
import { PortfolioAccount } from "@/types/portfolio";

export default function ExchangeTabs({
  accounts,
  active,
  onChange,
}: {
  accounts: PortfolioAccount[];
  active: string;
  onChange: (ex: string) => void;
}) {
  return (
    <div className="flex gap-2 rounded-2xl border p-1 bg-white">
      {accounts.map((a) => {
        const is = a.exchange === active;
        return (
          <button
            key={a.exchange}
            onClick={() => onChange(a.exchange)}
            className={`px-3 py-2 rounded-xl text-sm transition ${
              is ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
            }`}
          >
            {label(a.exchange)}
          </button>
        );
      })}
    </div>
  );
}

function label(ex: string) {
  if (ex === "btcturk") return "BTCTurk";
  if (ex === "bist") return "BIST";
  if (ex === "paper") return "Paper";
  return "Binance";
}
