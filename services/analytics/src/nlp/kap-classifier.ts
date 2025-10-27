// services/analytics/src/nlp/kap-classifier.ts
// KAP Disclosure NLP Classifier

export type KAPClass =
  | 'FINANCIALS'       // Finansal tablolar
  | 'MATERIAL_EVENT'   // Özel durum açıklaması
  | 'DIVIDEND'         // Temettü
  | 'BUYBACK'          // Pay geri alım
  | 'CAPEX'            // Yatırım/kapasite
  | 'BOARD'            // Yönetim kurulu
  | 'MERGER'           // Birleşme/devir
  | 'GUIDANCE'         // Rehberlik/beklenti
  | 'OTHER';

export type TimeHorizon = 'short' | 'mid' | 'long';

export interface Classification {
  cls: KAPClass;
  horizon: TimeHorizon;
  score: number; // 0-1 confidence
  keywords: string[];
}

/**
 * Classify KAP disclosure based on title and content
 * Simple rule-based classifier (MVP)
 * Future: LLM-based classification for better accuracy
 */
export function classifyKAPDisclosure(
  title: string,
  body?: string
): Classification {
  const text = (title + ' ' + (body || '')).toLowerCase();

  // Finansal Tablolar
  if (
    text.includes('finansal') ||
    text.includes('financial') ||
    text.includes('faaliyet raporu') ||
    text.includes('bilanço')
  ) {
    return {
      cls: 'FINANCIALS',
      horizon: 'mid',
      score: 0.85,
      keywords: ['finansal', 'bilanço', 'faaliyet'],
    };
  }

  // Temettü
  if (
    text.includes('temettü') ||
    text.includes('dividend') ||
    text.includes('kar payı') ||
    text.includes('kâr payı')
  ) {
    return {
      cls: 'DIVIDEND',
      horizon: 'mid',
      score: 0.80,
      keywords: ['temettü', 'kar payı'],
    };
  }

  // Pay Geri Alım
  if (
    text.includes('pay geri alım') ||
    text.includes('buyback') ||
    text.includes('geri alım program')
  ) {
    return {
      cls: 'BUYBACK',
      horizon: 'short',
      score: 0.75,
      keywords: ['geri alım', 'buyback'],
    };
  }

  // Yatırım/CAPEX
  if (
    text.includes('yatırım') ||
    text.includes('kapasite') ||
    text.includes('teşvik') ||
    text.includes('fabrika') ||
    text.includes('üretim')
  ) {
    return {
      cls: 'CAPEX',
      horizon: 'long',
      score: 0.70,
      keywords: ['yatırım', 'kapasite'],
    };
  }

  // Özel Durum
  if (
    text.includes('özel durum') ||
    text.includes('material event') ||
    text.includes('maddi olay')
  ) {
    return {
      cls: 'MATERIAL_EVENT',
      horizon: 'short',
      score: 0.90,
      keywords: ['özel durum', 'maddi olay'],
    };
  }

  // Birleşme/Devir
  if (
    text.includes('birleşme') ||
    text.includes('merger') ||
    text.includes('devralma') ||
    text.includes('ortaklık')
  ) {
    return {
      cls: 'MERGER',
      horizon: 'long',
      score: 0.80,
      keywords: ['birleşme', 'ortaklık'],
    };
  }

  // Rehberlik/Beklenti
  if (
    text.includes('rehberlik') ||
    text.includes('beklenti') ||
    text.includes('guidance') ||
    text.includes('forecast')
  ) {
    return {
      cls: 'GUIDANCE',
      horizon: 'mid',
      score: 0.75,
      keywords: ['rehberlik', 'beklenti'],
    };
  }

  // Yönetim Kurulu
  if (
    text.includes('yönetim kurulu') ||
    text.includes('board') ||
    text.includes('genel kurul')
  ) {
    return {
      cls: 'BOARD',
      horizon: 'mid',
      score: 0.60,
      keywords: ['yönetim kurulu'],
    };
  }

  // Diğer
  return {
    cls: 'OTHER',
    horizon: 'mid',
    score: 0.30,
    keywords: [],
  };
}

/**
 * Generate trading suggestion based on classification
 */
export function suggestionFromClass(
  cls: KAPClass,
  horizon: TimeHorizon
): {
  horizon: TimeHorizon;
  action: string;
  window: string;
  risk: string;
  description: string;
} {
  switch (cls) {
    case 'MATERIAL_EVENT':
      return {
        horizon,
        action: 'watch_reaction',
        window: '15m-1h',
        risk: 'tight',
        description: 'Özel durum açıklaması - anlık piyasa reaksiyonunu izle',
      };

    case 'FINANCIALS':
      return {
        horizon,
        action: 'post_earnings_play',
        window: '1-3 gün',
        risk: 'moderate',
        description: 'Finansal tablo açıklaması - kazanç sonrası momentum',
      };

    case 'DIVIDEND':
      return {
        horizon,
        action: 'dividend_play',
        window: '3-10 gün',
        risk: 'conservative',
        description: 'Temettü ilanı - temettü öncesi akümülasyon',
      };

    case 'BUYBACK':
      return {
        horizon,
        action: 'accumulation_bias',
        window: '1-5 gün',
        risk: 'moderate',
        description: 'Geri alım programı - fiyat desteği beklentisi',
      };

    case 'CAPEX':
      return {
        horizon,
        action: 'long_bias_review',
        window: '2-8 hafta',
        risk: 'balanced',
        description: 'Yatırım/kapasite - uzun vadeli büyüme potansiyeli',
      };

    case 'MERGER':
      return {
        horizon,
        action: 'event_driven',
        window: '4-12 hafta',
        risk: 'moderate',
        description: 'Birleşme/devralma - event-driven strateji',
      };

    case 'GUIDANCE':
      return {
        horizon,
        action: 'trend_confirmation',
        window: '5-15 gün',
        risk: 'moderate',
        description: 'Rehberlik güncelleme - trend doğrulama',
      };

    case 'BOARD':
      return {
        horizon,
        action: 'monitor',
        window: '3-7 gün',
        risk: 'neutral',
        description: 'Yönetim kurulu kararı - izle',
      };

    default:
      return {
        horizon,
        action: 'monitor',
        window: '1-5 gün',
        risk: 'neutral',
        description: 'Genel bildirim - takip et',
      };
  }
}

