// services/analytics/src/nlp/news-classifier.ts
// Enhanced KAP/News classifier with impact scoring

export type NewsImpact = 1 | 0 | -1; // Positive, Neutral, Negative

export interface NewsClassification {
  topic: string;
  impact: NewsImpact;
  confidence: number;
  keywords: string[];
  horizon: 'short' | 'mid' | 'long';
  sessionTimeMultiplier?: number; // Market open/close weight
}

/**
 * Classify news/KAP disclosure with impact score
 * Enhanced version with session timing
 */
export function classifyNewsWithImpact(
  title: string,
  body: string = '',
  timestamp?: Date
): NewsClassification {
  const text = (title + ' ' + body).toLowerCase();
  
  // Session time multiplier (higher impact at open/close)
  let sessionMult = 1.0;
  if (timestamp) {
    const hour = timestamp.getHours();
    // Istanbul market: 10:00-18:00
    if (hour >= 9 && hour <= 11) sessionMult = 1.3; // Market open
    else if (hour >= 17 && hour <= 18) sessionMult = 1.2; // Market close
  }

  // Finansal Sonuç (Positive/Negative based on keywords)
  if (text.includes('net kar') || text.includes('gelir artışı') || text.includes('büyüme')) {
    const isPositive = text.includes('artış') || text.includes('yükselme') || text.includes('rekor');
    return {
      topic: 'FINANCIAL_RESULTS',
      impact: isPositive ? 1 : 0,
      confidence: 0.80,
      keywords: ['finansal sonuç', 'net kar', 'gelir'],
      horizon: 'mid',
      sessionTimeMultiplier: sessionMult,
    };
  }

  // Temettü (Positive)
  if (text.includes('temettü') || text.includes('kar payı')) {
    return {
      topic: 'DIVIDEND',
      impact: 1,
      confidence: 0.75,
      keywords: ['temettü'],
      horizon: 'mid',
      sessionTimeMultiplier: sessionMult,
    };
  }

  // Pay Geri Alım (Positive)
  if (text.includes('geri alım') || text.includes('buyback')) {
    return {
      topic: 'BUYBACK',
      impact: 1,
      confidence: 0.70,
      keywords: ['geri alım'],
      horizon: 'short',
      sessionTimeMultiplier: sessionMult * 1.2, // Higher short-term impact
    };
  }

  // Yatırım/Capex (Positive long-term)
  if (text.includes('yatırım') || text.includes('kapasite') || text.includes('teşvik')) {
    return {
      topic: 'CAPEX',
      impact: 1,
      confidence: 0.65,
      keywords: ['yatırım', 'kapasite'],
      horizon: 'long',
    };
  }

  // Borçlanma (Neutral to Negative)
  if (text.includes('borç') || text.includes('kredi') || text.includes('finansman')) {
    const isNegative = text.includes('temerrüt') || text.includes('iflas') || text.includes('yüksek borç');
    return {
      topic: 'DEBT',
      impact: isNegative ? -1 : 0,
      confidence: 0.60,
      keywords: ['borç', 'kredi'],
      horizon: 'mid',
    };
  }

  // Dava/Risk (Negative)
  if (text.includes('dava') || text.includes('soruşturma') || text.includes('ceza')) {
    return {
      topic: 'LEGAL_RISK',
      impact: -1,
      confidence: 0.70,
      keywords: ['dava', 'soruşturma'],
      horizon: 'mid',
      sessionTimeMultiplier: sessionMult * 1.3,
    };
  }

  // İhale/Proje (Positive)
  if (text.includes('ihale') || text.includes('proje') || text.includes('sözleşme')) {
    return {
      topic: 'PROJECT_WIN',
      impact: 1,
      confidence: 0.65,
      keywords: ['ihale', 'proje'],
      horizon: 'short',
    };
  }

  // Yönetim Değişimi (Neutral)
  if (text.includes('yönetim') || text.includes('ceo') || text.includes('genel müdür')) {
    return {
      topic: 'MANAGEMENT_CHANGE',
      impact: 0,
      confidence: 0.50,
      keywords: ['yönetim'],
      horizon: 'mid',
    };
  }

  // Default: Other
  return {
    topic: 'OTHER',
    impact: 0,
    confidence: 0.30,
    keywords: [],
    horizon: 'mid',
  };
}

