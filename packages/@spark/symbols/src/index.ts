// Symbol Normalization
// BTCTURK örnekleri: BTCUSDT->BTC/USDT, BTCTRY->BTC/TRY vb.

export function normalize(source: string, raw: string): string {
  // BTCTURK örnekleri: BTCUSDT->BTC/USDT, BTCTRY->BTC/TRY vb.
  // Basit kural + özel eşlemeler; TODO: tabloyu genişlet.
  const m = raw.match(/^([A-Z]+)(USDT|TRY|USD|EUR|BUSD|USDC)$/);
  if (m) return `${m[1]}/${m[2]}`;
  return raw;
}

export function isSupportedPair(sym: string): boolean {
  return /.+\/(USDT|TRY|USD|EUR)$/i.test(sym);
}

export interface SymbolMapping {
  source: string;
  raw: string;
  normalized: string;
  supported: boolean;
}

export function mapSymbol(source: string, raw: string): SymbolMapping {
  const normalized = normalize(source, raw);
  const supported = isSupportedPair(normalized);
  
  return {
    source,
    raw,
    normalized,
    supported
  };
}
