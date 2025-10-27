// services/analytics/src/correlation/universe.ts
// Universe definitions for correlation analysis

export interface Universe {
  name: string;
  symbols: string[];
  leaders?: string[]; // Potential leaders in this universe
  description: string;
}

/**
 * Predefined universes for correlation analysis
 */
export const UNIVERSES: Record<string, Universe> = {
  BIST_CORE: {
    name: 'BIST_CORE',
    symbols: [
      'XU100',      // BIST 100 Index
      'XBANK',      // Bank Index
      'THYAO',      // Türk Hava Yolları
      'GARAN',      // Garanti Bankası
      'AKBNK',      // Akbank
      'ISCTR',      // İş Bankası (C)
      'YKBNK',      // Yapı Kredi
      'ASELS',      // Aselsan
      'TUPRS',      // Tüpraş
      'BIMAS',      // BİM
    ],
    leaders: ['XU100', 'XBANK', 'USDTRY'],
    description: 'BIST çekirdek hisseler + endeksler',
  },

  CRYPTO_CORE: {
    name: 'CRYPTO_CORE',
    symbols: [
      'BTCUSDT',
      'ETHUSDT',
      'BNBUSDT',
      'SOLUSDT',
      'ADAUSDT',
      'DOTUSDT',
      'MATICUSDT',
      'LINKUSDT',
    ],
    leaders: ['BTCUSDT', 'ETHUSDT'],
    description: 'Kripto majör coinler',
  },

  GLOBAL_MACRO: {
    name: 'GLOBAL_MACRO',
    symbols: [
      'USDTRY',     // USD/TRY
      'EURTRY',     // EUR/TRY
      'DXY',        // Dollar Index (mock)
      'BRENT',      // Brent Oil (mock)
      'GOLD',       // Gold (mock)
      'VIX',        // Volatility Index (mock)
    ],
    leaders: ['DXY', 'BRENT', 'VIX'],
    description: 'Global makro göstergeler',
  },

  BIST_GLOBAL_FUSION: {
    name: 'BIST_GLOBAL_FUSION',
    symbols: [
      // BIST
      'XU100',
      'XBANK',
      'GARAN',
      'AKBNK',
      // Global
      'USDTRY',
      'DXY',
      'BRENT',
      'VIX',
      // Crypto
      'BTCUSDT',
    ],
    leaders: ['USDTRY', 'DXY', 'BRENT', 'BTCUSDT'],
    description: 'BIST + Global + Crypto füzyonu',
  },

  CUSTOM: {
    name: 'CUSTOM',
    symbols: [],
    description: 'Kullanıcı tanımlı sembol seti',
  },
};

/**
 * Get universe by name
 */
export function getUniverse(name: string, customSymbols?: string[]): Universe {
  if (name === 'CUSTOM' && customSymbols) {
    return {
      ...UNIVERSES.CUSTOM,
      symbols: customSymbols,
    };
  }

  return UNIVERSES[name] || UNIVERSES.BIST_CORE;
}

/**
 * Get all available universes
 */
export function getAllUniverses(): Universe[] {
  return Object.values(UNIVERSES);
}

/**
 * Get potential leaders for a universe
 */
export function getLeadersForUniverse(universeName: string): string[] {
  const universe = UNIVERSES[universeName];
  return universe?.leaders || [];
}

