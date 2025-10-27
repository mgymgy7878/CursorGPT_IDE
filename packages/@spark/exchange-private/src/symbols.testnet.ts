export const TESTNET_SYMBOLS = [
  "BTCUSDT","ETHUSDT","BNBUSDT","XRPUSDT","ADAUSDT"
] as const;

export const TESTNET_MIN_QTY: Record<string,string> = {
  BTCUSDT: "0.0005",
  ETHUSDT: "0.005",
  BNBUSDT: "0.05",
  XRPUSDT: "5",
  ADAUSDT: "5",
};

export function isAllowedSymbol(sym?: string): sym is typeof TESTNET_SYMBOLS[number] {
  return !!sym && TESTNET_SYMBOLS.includes(sym as any);
}

export function checkMinQty(sym: string, qty: string): boolean {
  const min = TESTNET_MIN_QTY[sym];
  if (!min) return true;
  return Number(qty) >= Number(min);
} 