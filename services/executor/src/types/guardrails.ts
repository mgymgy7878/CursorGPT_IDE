export type Guardrails = {
  killSwitch: boolean;
  maxExposurePct: number; // 0-100
  whitelist: string[]; // örn: ["BINANCE:BTCUSDT","BTCTURK:BTCTRY"]
};
