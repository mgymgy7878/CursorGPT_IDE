// services/analytics/src/metrics/correlation.ts
import { Counter, Gauge } from 'prom-client';

/**
 * Correlation windows computed
 */
export const corrWindows = new Counter({
  name: 'spark_corr_windows_total',
  help: 'Total correlation windows computed',
  labelNames: ['universe'],
});

/**
 * Correlation matrix last timestamp
 */
export const corrMatrixLastTs = new Gauge({
  name: 'spark_corr_matrix_last_ts_seconds',
  help: 'Unix timestamp of last correlation matrix computation',
  labelNames: [],
});

/**
 * Leaders computed
 */
export const corrLeadersComputed = new Counter({
  name: 'spark_corr_leaders_computed_total',
  help: 'Total leader computations',
  labelNames: ['symbol'],
});

/**
 * Signal triggers
 */
export const signalTriggers = new Counter({
  name: 'spark_signal_triggers_total',
  help: 'Total correlation signals triggered',
  labelNames: ['rule', 'action'], // rule=FOLLOWER_CONTINUATION, action=open/close/reverse
});

/**
 * Regime breaks detected
 */
export const regimeBreaks = new Counter({
  name: 'spark_follow_regime_breaks_total',
  help: 'Total regime break events detected',
  labelNames: ['symbol'],
});

/**
 * News items classified
 */
export const newsClassified = new Counter({
  name: 'spark_news_items_classified_total',
  help: 'Total news items classified',
  labelNames: ['topic', 'impact'], // impact=positive/neutral/negative
});

/**
 * Macro events processed
 */
export const macroEvents = new Counter({
  name: 'spark_macro_events_total',
  help: 'Total macro events processed',
  labelNames: ['bank', 'type'], // type=expectation/decision
});

/**
 * Metrics export
 */
export const correlationMetrics = {
  windows: corrWindows,
  matrixLastTs: corrMatrixLastTs,
  leadersComputed: corrLeadersComputed,
  signalTriggers,
  regimeBreaks,
  newsClassified,
  macroEvents,
};

