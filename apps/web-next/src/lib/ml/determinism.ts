import { score } from './fusion';
import { FeatureRow } from './schema';

/**
 * Test vectors for determinism validation
 */
export const DETERMINISM_TEST_VECTORS: Array<{
  name: string;
  feature: FeatureRow;
  expectedDecision: number;
  expectedConfidMin: number;
  expectedConfidMax: number;
}> = [
  {
    name: "normal_btc",
    feature: {
      ts: 1697241600000,
      symbol: "BTCUSDT",
      tf: "1h",
      o: 27500, h: 27650, l: 27450, c: 27600, v: 1200,
      rsi_14: 45.5,
      macd_hist: 0.25,
      ema_20: 27550,
      ema_50: 27400
    },
    expectedDecision: 1, // bullish
    expectedConfidMin: 0.55,
    expectedConfidMax: 0.75
  },
  {
    name: "edge_low_confidence",
    feature: {
      ts: 1697241600000,
      symbol: "BTCUSDT", 
      tf: "1h",
      o: 27500, h: 27550, l: 27450, c: 27510, v: 800,
      rsi_14: 51, // Neutral RSI
      macd_hist: 0.02, // Weak MACD
      ema_20: 27500,
      ema_50: 27500
    },
    expectedDecision: 0, // flat
    expectedConfidMin: 0.45,
    expectedConfidMax: 0.55
  },
  {
    name: "edge_bearish",
    feature: {
      ts: 1697241600000,
      symbol: "BTCUSDT",
      tf: "1h", 
      o: 27600, h: 27600, l: 27400, c: 27450, v: 1500,
      rsi_14: 25, // Oversold
      macd_hist: -0.15, // Bearish
      ema_20: 27450,
      ema_50: 27550
    },
    expectedDecision: -1, // bearish
    expectedConfidMin: 0.55,
    expectedConfidMax: 0.75
  }
];

/**
 * Run determinism test suite
 * CI will call this and fail if any test fails
 */
export async function runDeterminismTests(): Promise<{
  passed: number;
  failed: number;
  results: Array<{
    name: string;
    passed: boolean;
    actual: any;
    expected: any;
    error?: string;
  }>;
}> {
  const results: Array<any> = [];
  let passed = 0;
  let failed = 0;

  for (const test of DETERMINISM_TEST_VECTORS) {
    try {
      const actual = await score({
        modelId: "fusion-v2.0.0",
        feature: test.feature
      });

      const decisionMatch = actual.decision === test.expectedDecision;
      const confidInRange = actual.confid >= test.expectedConfidMin && actual.confid <= test.expectedConfidMax;
      
      const testPassed = decisionMatch && confidInRange;
      
      if (testPassed) {
        passed++;
      } else {
        failed++;
      }

      results.push({
        name: test.name,
        passed: testPassed,
        actual: {
          decision: actual.decision,
          confid: actual.confid
        },
        expected: {
          decision: test.expectedDecision,
          confidRange: [test.expectedConfidMin, test.expectedConfidMax]
        },
        error: testPassed ? undefined : 
          `Decision: ${actual.decision} !== ${test.expectedDecision} OR ` +
          `Confid: ${actual.confid} not in [${test.expectedConfidMin}, ${test.expectedConfidMax}]`
      });

    } catch (error: any) {
      failed++;
      results.push({
        name: test.name,
        passed: false,
        actual: null,
        expected: test.expectedDecision,
        error: error.message
      });
    }
  }

  return { passed, failed, results };
}
