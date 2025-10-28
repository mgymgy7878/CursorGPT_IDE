import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Prometheus text format endpoint
 * Content-Type: text/plain; version=0.0.4; charset=utf-8
 * 
 * @see https://prometheus.io/docs/instrumenting/exposition_formats/
 * @see https://chromium.googlesource.com/external/github.com/prometheus/common/+/refs/tags/v0.63.0/expfmt/expfmt.go
 */
export async function GET() {
  // Mock metrics in Prometheus text format
  const metrics = [
    '# HELP spark_up 1 if service is alive',
    '# TYPE spark_up gauge',
    'spark_up 1',
    '',
    '# HELP spark_ws_btcturk_msgs_total Total BTCTurk WebSocket messages received',
    '# TYPE spark_ws_btcturk_msgs_total counter',
    'spark_ws_btcturk_msgs_total 0',
    '',
    '# HELP spark_ws_staleness_seconds Seconds since last WebSocket message',
    '# TYPE spark_ws_staleness_seconds gauge',
    'spark_ws_staleness_seconds 2',
    '',
    '# HELP spark_api_latency_p95_ms API latency P95 in milliseconds',
    '# TYPE spark_api_latency_p95_ms gauge',
    'spark_api_latency_p95_ms 58',
    '',
    '# HELP spark_error_rate Error rate percentage',
    '# TYPE spark_error_rate gauge',
    'spark_error_rate 0',
    '',
  ].join('\n');

  return new Response(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
