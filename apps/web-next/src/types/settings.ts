export type ThemeMode = "light" | "dark";
export type Language = "tr" | "en";

export interface ExchangeKeys { apiKey: string; secret: string; }
export interface Settings {
  theme: ThemeMode;
  language: Language;
  exchanges: {
    binance?: ExchangeKeys;
    btcturk?: ExchangeKeys;
  };
  ai?: { openaiKey?: string };
  updatedAt?: string;
}
