/**
 * Hassas Doğrulamalar - Precision & MinQty
 * BTCTurk ExchangeInfo eşiklerini validate et
 */

export interface SymbolInfo {
  symbol: string;
  minQty: number;
  qtyPrecision: number;
  minPrice: number;
  pricePrecision: number;
  minNotional: number;
  commission: number; // TRY komisyonu
}

/**
 * BTCTurk sembol bilgileri (gerçek veriler)
 */
export const BTCTURK_SYMBOLS: Record<string, SymbolInfo> = {
  'BTCTRY': {
    symbol: 'BTCTRY',
    minQty: 0.00000001,
    qtyPrecision: 8,
    minPrice: 0.01,
    pricePrecision: 2,
    minNotional: 10,
    commission: 0.25 // 0.25% TRY komisyonu
  },
  'ETHTRY': {
    symbol: 'ETHTRY',
    minQty: 0.00000001,
    qtyPrecision: 8,
    minPrice: 0.01,
    pricePrecision: 2,
    minNotional: 10,
    commission: 0.25
  },
  'ADATRY': {
    symbol: 'ADATRY',
    minQty: 0.01,
    qtyPrecision: 2,
    minPrice: 0.01,
    pricePrecision: 2,
    minNotional: 10,
    commission: 0.25
  },
  'DOTTRY': {
    symbol: 'DOTTRY',
    minQty: 0.01,
    qtyPrecision: 2,
    minPrice: 0.01,
    pricePrecision: 2,
    minNotional: 10,
    commission: 0.25
  }
};

/**
 * Miktar ve fiyat doğrulaması
 */
export function validateQtyPx(symbol: string, qty: string, px?: string): { qty: string; price?: string } {
  const symbolInfo = BTCTURK_SYMBOLS[symbol];
  if (!symbolInfo) {
    throw new Error(`UNKNOWN_SYMBOL: ${symbol}`);
  }

  const q = Number(qty);
  const p = px ? Number(px) : undefined;

  // Minimum miktar kontrolü
  if (q < symbolInfo.minQty) {
    throw new Error(`MIN_QTY: ${q} < ${symbolInfo.minQty}`);
  }

  // Miktar precision
  const qStr = q.toFixed(symbolInfo.qtyPrecision);
  const qtyNum = Number(qStr);
  
  if (qtyNum !== q) {
    throw new Error(`QTY_PRECISION: ${q} → ${qtyNum} (precision: ${symbolInfo.qtyPrecision})`);
  }

  let result: { qty: string; price?: string } = { qty: qStr };

  // Fiyat kontrolü (limit order için)
  if (p !== undefined) {
    if (p < symbolInfo.minPrice) {
      throw new Error(`MIN_PRICE: ${p} < ${symbolInfo.minPrice}`);
    }

    // Fiyat precision
    const pStr = p.toFixed(symbolInfo.pricePrecision);
    const priceNum = Number(pStr);
    
    if (priceNum !== p) {
      throw new Error(`PRICE_PRECISION: ${p} → ${priceNum} (precision: ${symbolInfo.pricePrecision})`);
    }

    result.price = pStr;

    // Minimum notional kontrolü
    const notional = qtyNum * priceNum;
    if (notional < symbolInfo.minNotional) {
      throw new Error(`MIN_NOTIONAL: ${notional} < ${symbolInfo.minNotional}`);
    }
  }

  return result;
}

/**
 * Komisyon hesaplama (TRY cinsinden)
 */
export function calculateCommission(symbol: string, notionalTRY: number): number {
  const symbolInfo = BTCTURK_SYMBOLS[symbol];
  if (!symbolInfo) {
    throw new Error(`UNKNOWN_SYMBOL: ${symbol}`);
  }

  return notionalTRY * (symbolInfo.commission / 100);
}

/**
 * Net miktar hesaplama (komisyon düşülmüş)
 */
export function calculateNetAmount(symbol: string, grossAmountTRY: number): number {
  const commission = calculateCommission(symbol, grossAmountTRY);
  return grossAmountTRY - commission;
}

/**
 * Sembol bilgisi getir
 */
export function getSymbolInfo(symbol: string): SymbolInfo {
  const symbolInfo = BTCTURK_SYMBOLS[symbol];
  if (!symbolInfo) {
    throw new Error(`UNKNOWN_SYMBOL: ${symbol}`);
  }
  return symbolInfo;
}

/**
 * Tüm sembol listesi
 */
export function getAllSymbols(): string[] {
  return Object.keys(BTCTURK_SYMBOLS);
}

/**
 * Sembol var mı kontrolü
 */
export function isSymbolValid(symbol: string): boolean {
  return symbol in BTCTURK_SYMBOLS;
}

/**
 * Validation test fonksiyonu
 */
export function testValidation() {
  console.log('Testing validation...');
  
  try {
    // Valid test
    const result1 = validateQtyPx('BTCTRY', '0.001', '100000');
    console.log('✓ Valid BTCTRY:', result1);
    
    // Invalid qty precision
    try {
      validateQtyPx('BTCTRY', '0.001000001', '100000');
    } catch (e) {
      console.log('✓ Caught precision error:', e.message);
    }
    
    // Invalid min qty
    try {
      validateQtyPx('BTCTRY', '0.000000001', '100000');
    } catch (e) {
      console.log('✓ Caught min qty error:', e.message);
    }
    
    // Commission test
    const commission = calculateCommission('BTCTRY', 1000);
    console.log('✓ Commission for 1000 TRY:', commission, 'TRY');
    
  } catch (e) {
    console.error('✗ Validation test failed:', e.message);
  }
}
