import { NextResponse } from "next/server";
import type { PortfolioResponse } from "@/types/portfolio";
import { fetchWithTimeout } from "@/lib/net/fetchWithTimeout";

const B = process.env.EXECUTOR_URL ?? process.env.EXECUTOR_BASE_URL; // ör: http://127.0.0.1:4001

export async function GET() {
  // PROD: backend varsa oraya proxy et
  if (B) {
    try {
      // fetchWithTimeout kullan (AbortController + setTimeout - daha öngörülebilir)
      const r = await fetchWithTimeout(`${B}/api/portfolio`, { cache: "no-store" }, 5000);
      const data = (await r.json()) as PortfolioResponse;
      return NextResponse.json(data, { status: r.status });
    } catch (e) {
      // düşmeyelim, mock'a geçelim
    }
  }

  // DEV: mock fallback (USD kuru ~ 1.0, TRY için kaba dönüşüm)
  const now = new Date().toISOString();
  const mock: PortfolioResponse = {
    updatedAt: now,
    accounts: [
      {
        exchange: "binance",
        currency: "USD",
        totals: { totalUsd: 41250 },
        balances: [
          { asset: "BTC", amount: 0.52, priceUsd: 65000, valueUsd: 33800 },
          { asset: "ETH", amount: 2.1, priceUsd: 3200, valueUsd: 6720 },
          { asset: "USDT", amount: 730, priceUsd: 1, valueUsd: 730 },
        ],
      },
      {
        exchange: "btcturk",
        currency: "TRY",
        totals: { totalUsd: 6800, totalTry: 225000 },
        balances: [
          { asset: "BTCTRY", amount: 0.08, priceUsd: 65000, valueUsd: 5200 },
          { asset: "TRY", amount: 40000, priceUsd: 0.03, valueUsd: 1600 },
        ],
      },
    ],
  };
  return NextResponse.json(mock);
}
