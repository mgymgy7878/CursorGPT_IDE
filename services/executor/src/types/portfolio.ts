// services/executor/src/types/portfolio.ts
export type ExchangeKind = "binance" | "btcturk" | "bist" | "paper";

export interface AssetRow {
  asset: string;          // BTC, ETH, USDT, THYAO, vb.
  amount: number;         // 0.123
  priceUsd?: number;      // 30000
  valueUsd?: number;      // amount * priceUsd
}

export interface PortfolioAccount {
  exchange: ExchangeKind;
  currency: "USD" | "TRY";
  totals: {
    totalUsd: number;     // hepsi USD'ye çevrilmiş toplam
    totalTry?: number;    // varsa
  };
  balances: AssetRow[];
}

export interface PortfolioResponse {
  accounts: PortfolioAccount[];
  updatedAt: string;      // ISO
}

