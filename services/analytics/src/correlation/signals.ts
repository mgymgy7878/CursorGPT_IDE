// services/analytics/src/correlation/signals.ts
// Signal generation rules for leader-follower strategies

import type { CorrEdge } from './engine.js';

export interface SignalParams {
  corrMin?: number;      // Min correlation (default: 0.6)
  betaMin?: number;      // Min beta (default: 0.7)
  betaMax?: number;      // Max beta (default: 1.3)
  zScoreMax?: number;    // Max z-score (default: 1.5)
  lagMax?: number;       // Max acceptable lag (default: 2)
  spreadZMax?: number;   // Max spread z-score for mean reversion (default: 2.0)
}

export interface MoneyFlowContext {
  nmf: number;          // Net Money Flow
  obi: number;          // Order Book Imbalance
  cvd: number;          // Cumulative Volume Delta
}

export interface Signal {
  action: 'open' | 'close' | 'reverse' | 'none';
  direction?: 'same' | 'opposite';
  confidence: number;   // 0-1
  reason: string;
  details?: any;
}

/**
 * FOLLOWER_CONTINUATION: Follow leader's move
 * 
 * Conditions:
 * - Strong correlation (rho >= corrMin)
 * - Low lag (0-2 bars)
 * - Beta in reasonable range
 * - Leader has momentum (z-score)
 * - Money flow confirms (NMF > 0)
 */
export function followerContinuation(
  edge: CorrEdge,
  leaderReturnZScore: number,
  moneyFlow: MoneyFlowContext,
  params: SignalParams = {}
): Signal {
  const {
    corrMin = 0.6,
    betaMin = 0.7,
    betaMax = 1.3,
    zScoreMax = 1.5,
    lagMax = 2,
  } = params;

  // Check conditions
  const strongCorr = Math.abs(edge.rho) >= corrMin;
  const lowLag = edge.lag >= 0 && edge.lag <= lagMax;
  const betaOk = edge.beta >= betaMin && edge.beta <= betaMax;
  const leaderMomentum = Math.abs(leaderReturnZScore) >= 1.0;
  const moneyFlowPositive = moneyFlow.nmf > 0;

  if (strongCorr && lowLag && betaOk && leaderMomentum && moneyFlowPositive) {
    return {
      action: 'open',
      direction: 'same',
      confidence: Math.min(Math.abs(edge.rho), 0.95),
      reason: `Güçlü korelasyon (ρ=${edge.rho.toFixed(2)}), düşük lag (${edge.lag}), pozitif NMF`,
      details: { edge, leaderReturnZScore, moneyFlow },
    };
  }

  return { action: 'none', confidence: 0, reason: 'Koşullar sağlanmadı' };
}

/**
 * FOLLOWER_MEAN_REVERT: Mean reversion when spread is extreme
 * 
 * Conditions:
 * - Strong correlation (cointegrated pair)
 * - Spread z-score extreme (> 2.0)
 * - Money flow opposite direction
 */
export function followerMeanRevert(
  edge: CorrEdge,
  spreadZScore: number,
  moneyFlow: MoneyFlowContext,
  params: SignalParams = {}
): Signal {
  const {
    corrMin = 0.6,
    spreadZMax = 2.0,
  } = params;

  const strongCorr = Math.abs(edge.rho) >= corrMin;
  const extremeSpread = Math.abs(spreadZScore) >= spreadZMax;

  if (strongCorr && extremeSpread) {
    // Expect mean reversion
    const direction = spreadZScore > 0 ? 'opposite' : 'same';
    
    return {
      action: 'open',
      direction,
      confidence: Math.min(Math.abs(spreadZScore) / 3.0, 0.90),
      reason: `Mean reversion: spread z-score=${spreadZScore.toFixed(2)}, ρ=${edge.rho.toFixed(2)}`,
      details: { edge, spreadZScore, moneyFlow },
    };
  }

  return { action: 'none', confidence: 0, reason: 'Mean reversion koşulları sağlanmadı' };
}

/**
 * BETA_BREAK: Regime change detected
 * 
 * Conditions:
 * - Sudden drop in correlation (Δρ < -0.3)
 * - OR sudden beta change (Δβ < -0.3)
 */
export function betaBreak(
  currentEdge: CorrEdge,
  previousEdge: CorrEdge | null
): Signal {
  if (!previousEdge) {
    return { action: 'none', confidence: 0, reason: 'Önceki edge yok' };
  }

  const deltaRho = currentEdge.rho - previousEdge.rho;
  const deltaBeta = currentEdge.beta - previousEdge.beta;

  const rhoBreak = deltaRho <= -0.3;
  const betaBreak = Math.abs(deltaBeta) >= 0.3;

  if (rhoBreak || betaBreak) {
    return {
      action: 'close',
      confidence: 0.80,
      reason: `Rejim değişikliği: Δρ=${deltaRho.toFixed(2)}, Δβ=${deltaBeta.toFixed(2)}`,
      details: { currentEdge, previousEdge, deltaRho, deltaBeta },
    };
  }

  return { action: 'none', confidence: 0, reason: 'Rejim stabil' };
}

/**
 * LEAD_CONFIRM: Leader momentum confirmed
 * 
 * Conditions:
 * - Strong correlation
 * - Clear lag (1-3 bars)
 * - Leader has strong directional move
 */
export function leadConfirm(
  edge: CorrEdge,
  leaderReturnZScore: number,
  params: SignalParams = {}
): Signal {
  const {
    corrMin = 0.6,
    zScoreMax = 1.5,
  } = params;

  const strongCorr = Math.abs(edge.rho) >= corrMin;
  const clearLag = edge.lag >= 1 && edge.lag <= 3;
  const strongLeader = Math.abs(leaderReturnZScore) >= zScoreMax;

  if (strongCorr && clearLag && strongLeader) {
    return {
      action: 'open',
      direction: leaderReturnZScore > 0 ? 'same' : 'opposite',
      confidence: 0.75,
      reason: `Leader teyidi: lag=${edge.lag}, ρ=${edge.rho.toFixed(2)}, z=${leaderReturnZScore.toFixed(2)}`,
      details: { edge, leaderReturnZScore },
    };
  }

  return { action: 'none', confidence: 0, reason: 'Leader teyidi yok' };
}

