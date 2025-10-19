// OpenTelemetry Trace Schema
// Uncomment when integrating @opentelemetry/api

/*
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('web-next', process.env.BUILD_SHA || 'dev');

export function traceAPICall(
  name: string, 
  attributes: Record<string, any>,
  fn: () => Promise<any>
) {
  return tracer.startActiveSpan(name, { kind: SpanKind.SERVER }, async (span) => {
    try {
      // Set common attributes
      span.setAttributes({
        'app.env': process.env.NODE_ENV || 'development',
        'app.build_sha': process.env.BUILD_SHA || 'dev',
        ...attributes
      });
      
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (e: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
      span.recordException(e);
      throw e;
    } finally {
      span.end();
    }
  });
}
*/

// Mock implementation until OTEL is configured
export function traceAPICall(
  name: string,
  attributes: Record<string, any>,
  fn: () => Promise<any>
) {
  console.log(`[Trace] ${name}`, attributes);
  return fn();
}

/**
 * Standard span attributes for ML operations
 */
export type MLSpanAttributes = {
  // Trading context
  'trading.symbol': string;
  'trading.tf': string;
  
  // ML model
  'ml.model_id': string;
  'ml.feature_version': string;
  'ml.decision': -1 | 0 | 1;
  'ml.score': number;
  'ml.confidence': number;
  
  // SLO metrics
  'slo.p95_ms'?: number;
  'slo.staleness_s'?: number;
  'slo.error_rate'?: number;
  
  // Guardrails
  'guardrails.pass': boolean;
  
  // User action
  'user.action': string;  // "preview" | "start" | "stop" etc
  
  // HTTP
  'http.status_code'?: number;
  'retry.after_s'?: number;
};

/**
 * Span hierarchy for ML scoring:
 * 
 * user_action.dashboard_click (CLIENT)
 *  └─ pipeline.build_features (SERVER)
 *      ├─ datasource.candles.read (INTERNAL)
 *      ├─ indicators.compute (INTERNAL)
 *      └─ features.sanitize (INTERNAL)
 *  └─ model.score (SERVER) ← ML decision
 *      └─ ensemble.fuse_signals (INTERNAL)
 *  └─ guardrails.evaluate (INTERNAL)
 *  └─ strategy.control (SERVER) ← start/stop/pause
 */

export const SPAN_NAMES = {
  USER_ACTION: 'user_action.dashboard_click',
  PIPELINE: 'pipeline.build_features',
  DATASOURCE: 'datasource.candles.read',
  INDICATORS: 'indicators.compute',
  SANITIZE: 'features.sanitize',
  MODEL_SCORE: 'model.score',
  ENSEMBLE: 'ensemble.fuse_signals',
  GUARDRAILS: 'guardrails.evaluate',
  STRATEGY_CONTROL: 'strategy.control'
} as const;

