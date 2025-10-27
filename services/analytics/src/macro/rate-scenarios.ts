// services/analytics/src/macro/rate-scenarios.ts
// Central bank rate decision scenarios and impact analysis

export type CentralBank = 'TCMB' | 'FED' | 'ECB' | 'BOE';
export type RateBias = 'cut' | 'hike' | 'hold';
export type StatementTone = 'hawkish' | 'dovish' | 'neutral';

export interface RateExpectation {
  bank: CentralBank;
  expectedBps: number;
  expectedBias: RateBias;
  decisionTime: string; // ISO timestamp
}

export interface RateDecision {
  bank: CentralBank;
  actualBps: number;
  statementTone: StatementTone;
  decisionTime: string;
}

export interface RateImpact {
  asset: string;
  expectedDirection: 'up' | 'down' | 'neutral';
  confidence: number;
  timeHorizon: string;
  reason: string;
}

/**
 * Calculate surprise (actual vs expected)
 */
export function calculateSurprise(
  expected: RateExpectation,
  actual: RateDecision
): {
  surpriseBps: number;
  surpriseType: 'hawkish' | 'dovish' | 'inline';
  magnitude: 'high' | 'moderate' | 'low';
} {
  const surpriseBps = actual.actualBps - expected.expectedBps;

  let surpriseType: 'hawkish' | 'dovish' | 'inline';
  if (surpriseBps > 25 || (surpriseBps >= 0 && actual.statementTone === 'hawkish')) {
    surpriseType = 'hawkish';
  } else if (surpriseBps < -25 || (surpriseBps <= 0 && actual.statementTone === 'dovish')) {
    surpriseType = 'dovish';
  } else {
    surpriseType = 'inline';
  }

  const magnitude = Math.abs(surpriseBps) > 50 ? 'high'
                  : Math.abs(surpriseBps) > 25 ? 'moderate'
                  : 'low';

  return { surpriseBps, surpriseType, magnitude };
}

/**
 * Generate impact scenarios for TCMB rate decision
 */
export function tcmbImpactScenarios(
  surprise: ReturnType<typeof calculateSurprise>
): RateImpact[] {
  const impacts: RateImpact[] = [];

  // USDTRY impact
  if (surprise.surpriseType === 'hawkish') {
    impacts.push({
      asset: 'USDTRY',
      expectedDirection: 'down',
      confidence: 0.75,
      timeHorizon: '1-4 saat',
      reason: 'Beklenenden hawkish → TL güçlenir',
    });
  } else if (surprise.surpriseType === 'dovish') {
    impacts.push({
      asset: 'USDTRY',
      expectedDirection: 'up',
      confidence: 0.75,
      timeHorizon: '1-4 saat',
      reason: 'Beklenenden dovish → TL zayıflar',
    });
  }

  // XU100 Bank Index
  if (surprise.surpriseType === 'hawkish' && surprise.magnitude !== 'low') {
    impacts.push({
      asset: 'XBANK',
      expectedDirection: 'up',
      confidence: 0.65,
      timeHorizon: '1-3 gün',
      reason: 'Faiz artışı → banka marjları pozitif',
    });
  }

  // XU100 General
  if (surprise.surpriseType === 'hawkish' && surprise.magnitude === 'high') {
    impacts.push({
      asset: 'XU100',
      expectedDirection: 'down',
      confidence: 0.60,
      timeHorizon: '1-2 gün',
      reason: 'Agresif sıkılaştırma → kısa vadede baskı',
    });
  }

  return impacts;
}

/**
 * Generate impact scenarios for FED rate decision
 */
export function fedImpactScenarios(
  surprise: ReturnType<typeof calculateSurprise>
): RateImpact[] {
  const impacts: RateImpact[] = [];

  // DXY (Dollar Index)
  if (surprise.surpriseType === 'hawkish') {
    impacts.push({
      asset: 'DXY',
      expectedDirection: 'up',
      confidence: 0.80,
      timeHorizon: '1-4 saat',
      reason: 'FED hawkish → Dollar güçlenir',
    });
  }

  // BTCUSDT (Risk-off if hawkish)
  if (surprise.surpriseType === 'hawkish' && surprise.magnitude !== 'low') {
    impacts.push({
      asset: 'BTCUSDT',
      expectedDirection: 'down',
      confidence: 0.70,
      timeHorizon: '1-6 saat',
      reason: 'FED hawkish → Risk-off, kripto baskı altında',
    });
  }

  // XU100 (Emerging markets pressure)
  if (surprise.surpriseType === 'hawkish') {
    impacts.push({
      asset: 'XU100',
      expectedDirection: 'down',
      confidence: 0.65,
      timeHorizon: '1-2 gün',
      reason: 'FED hawkish → Gelişen piyasalardan çıkış',
    });
  }

  return impacts;
}

/**
 * Generate impact scenarios based on bank
 */
export function generateImpactScenarios(
  expected: RateExpectation,
  actual: RateDecision
): {
  surprise: ReturnType<typeof calculateSurprise>;
  impacts: RateImpact[];
} {
  const surprise = calculateSurprise(expected, actual);

  let impacts: RateImpact[] = [];
  
  switch (actual.bank) {
    case 'TCMB':
      impacts = tcmbImpactScenarios(surprise);
      break;
    case 'FED':
      impacts = fedImpactScenarios(surprise);
      break;
    case 'ECB':
      // Similar logic for ECB
      impacts = [];
      break;
    case 'BOE':
      // Similar logic for BOE
      impacts = [];
      break;
  }

  return { surprise, impacts };
}

