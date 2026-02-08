export type Ticker = {
  symbol: string; // BTCUSDT
  price: number; // last price
  bid: number; // best bid
  ask: number; // best ask
  volume24h?: number;
  change24h?: number; // -0.012 = -1.2%
  ts: number; // epoch ms
};

/**
 * Veri kaynağı türü — UI'da pill + tooltip otomasyonu için.
 * live: canlı feed (Binance, lisanslı BIST/VİOP)
 * delayed: gecikmeli
 * reference: referans (örn. ECB günlük kur — işlem fiyatı değil)
 * stub: veri yok / Data feed required
 */
export type SourceKind = "live" | "delayed" | "reference" | "stub";

/** Normalize DTO for dashboard instruments (segment-based tickers) */
export type UiTicker = {
  symbol: string;
  venue: "crypto" | "bist" | "viop" | "fx" | "commodity";
  currency?: "USD" | "TRY" | "EUR";
  last: number | null;
  /** Yüzde puan (percentage points): +1.23 = %1.23. Fraction değil; kaynak fraction döndürüyorsa normalize et. */
  changePct: number | null;
  vol: number | null;
  spark: number[];
  ts: number;
  /** Kaynak etiketi: canlı / referans / gecikmeli (segment veya enstrüman bazında) */
  sourceLabel?: string;
  /** Kaynak türü — pill + tooltip otomasyonu (live | delayed | reference | stub) */
  sourceKind?: SourceKind;
  /** BIST: sessionState (pre | open | close | after); VİOP: aynı */
  sessionState?: "pre" | "open" | "close" | "after";
  /** BIST: volTry veya volShares; VİOP: volContracts */
  volTry?: number | null;
  volShares?: number | null;
  volContracts?: number | null;
  /** VİOP: vadeli vade (YYYYMM veya contract code) */
  expiry?: string | null;
  /** VİOP: open interest (varsa) */
  oi?: number | null;
  /** Gösterim: fiyat ondalık, lot step (BIST/VİOP minimum contract) */
  priceDecimals?: number;
  lotStep?: number;
};

export type Health = "connecting" | "healthy" | "degraded" | "down";
export type Staleness = "ok" | "warn" | "stale";
