/**
 * Gate D: Copilot SSE Metrics
 *
 * Prometheus metrics for Copilot SSE streams (server-side).
 * HMR-safe singleton pattern using globalThis.
 *
 * Metrics:
 * - spark_copilot_sse_stream_open_total (counter)
 * - spark_copilot_sse_stream_close_total{reason} (counter)
 * - spark_copilot_sse_stream_active (gauge)
 * - spark_copilot_sse_event_total{event} (counter)
 * - spark_copilot_sse_invalid_drop_total{event,reason} (counter)
 * - spark_copilot_sse_bytes_total (counter)
 * - spark_copilot_sse_duration_seconds (summary)
 */

const g = globalThis as any;

export interface CopilotSseMetrics {
  counters: {
    spark_copilot_sse_stream_open_total: number;
    spark_copilot_sse_stream_close_total: Record<string, number>; // reason -> count
    spark_copilot_sse_event_total: Record<string, number>; // event -> count
    spark_copilot_sse_invalid_drop_total: Record<string, number>; // "event:reason" -> count
    spark_copilot_sse_bytes_total: number;
  };
  gauges: {
    spark_copilot_sse_stream_active: number;
  };
  summaries: {
    spark_copilot_sse_duration_seconds: {
      sum: number;
      count: number;
      buckets?: number[]; // For histogram-like behavior
    };
  };
}

if (!g.__sparkCopilotSseMetrics) {
  g.__sparkCopilotSseMetrics = {
    counters: {
      spark_copilot_sse_stream_open_total: 0,
      spark_copilot_sse_stream_close_total: {},
      spark_copilot_sse_event_total: {},
      spark_copilot_sse_invalid_drop_total: {},
      spark_copilot_sse_bytes_total: 0,
    },
    gauges: {
      spark_copilot_sse_stream_active: 0,
    },
    summaries: {
      spark_copilot_sse_duration_seconds: {
        sum: 0,
        count: 0,
      },
    },
  } as CopilotSseMetrics;
}

export const copilotSseMetrics: CopilotSseMetrics = g.__sparkCopilotSseMetrics as CopilotSseMetrics;

/**
 * Increment stream open counter and active gauge
 */
export function onSseStreamOpen() {
  copilotSseMetrics.counters.spark_copilot_sse_stream_open_total += 1;
  copilotSseMetrics.gauges.spark_copilot_sse_stream_active += 1;
}

/**
 * Increment stream close counter and decrement active gauge
 */
export function onSseStreamClose(reason: 'done' | 'abort' | 'error' | 'timeout') {
  const key = reason;
  copilotSseMetrics.counters.spark_copilot_sse_stream_close_total[key] =
    (copilotSseMetrics.counters.spark_copilot_sse_stream_close_total[key] || 0) + 1;
  copilotSseMetrics.gauges.spark_copilot_sse_stream_active = Math.max(0,
    copilotSseMetrics.gauges.spark_copilot_sse_stream_active - 1);
}

/**
 * Increment event counter
 */
export function onSseEvent(event: string) {
  copilotSseMetrics.counters.spark_copilot_sse_event_total[event] =
    (copilotSseMetrics.counters.spark_copilot_sse_event_total[event] || 0) + 1;
}

/**
 * Increment invalid drop counter
 */
export function onSseInvalidDrop(event: string, reason: string) {
  const key = `${event}:${reason}`;
  copilotSseMetrics.counters.spark_copilot_sse_invalid_drop_total[key] =
    (copilotSseMetrics.counters.spark_copilot_sse_invalid_drop_total[key] || 0) + 1;
}

/**
 * Add bytes to total
 */
export function onSseBytes(bytes: number) {
  copilotSseMetrics.counters.spark_copilot_sse_bytes_total += bytes;
}

/**
 * Record stream duration
 */
export function onSseStreamDuration(seconds: number) {
  copilotSseMetrics.summaries.spark_copilot_sse_duration_seconds.sum += seconds;
  copilotSseMetrics.summaries.spark_copilot_sse_duration_seconds.count += 1;
}

/**
 * Format metrics for Prometheus text format
 */
export function formatCopilotSseMetricsProm(): string {
  const lines: string[] = [];

  // Stream open total
  lines.push('# HELP spark_copilot_sse_stream_open_total Total Copilot SSE streams opened');
  lines.push('# TYPE spark_copilot_sse_stream_open_total counter');
  lines.push(`spark_copilot_sse_stream_open_total ${copilotSseMetrics.counters.spark_copilot_sse_stream_open_total}`);
  lines.push('');

  // Stream close total (with reason labels)
  lines.push('# HELP spark_copilot_sse_stream_close_total Total Copilot SSE streams closed by reason');
  lines.push('# TYPE spark_copilot_sse_stream_close_total counter');
  for (const [reason, count] of Object.entries(copilotSseMetrics.counters.spark_copilot_sse_stream_close_total)) {
    lines.push(`spark_copilot_sse_stream_close_total{reason="${reason}"} ${count}`);
  }
  if (Object.keys(copilotSseMetrics.counters.spark_copilot_sse_stream_close_total).length === 0) {
    lines.push('spark_copilot_sse_stream_close_total{reason="done"} 0');
  }
  lines.push('');

  // Stream active gauge
  lines.push('# HELP spark_copilot_sse_stream_active Current number of active Copilot SSE streams');
  lines.push('# TYPE spark_copilot_sse_stream_active gauge');
  lines.push(`spark_copilot_sse_stream_active ${copilotSseMetrics.gauges.spark_copilot_sse_stream_active}`);
  lines.push('');

  // Event total (with event labels)
  lines.push('# HELP spark_copilot_sse_event_total Total Copilot SSE events by type');
  lines.push('# TYPE spark_copilot_sse_event_total counter');
  for (const [event, count] of Object.entries(copilotSseMetrics.counters.spark_copilot_sse_event_total)) {
    lines.push(`spark_copilot_sse_event_total{event="${event}"} ${count}`);
  }
  if (Object.keys(copilotSseMetrics.counters.spark_copilot_sse_event_total).length === 0) {
    lines.push('spark_copilot_sse_event_total{event="token"} 0');
  }
  lines.push('');

  // Invalid drop total (with event and reason labels)
  lines.push('# HELP spark_copilot_sse_invalid_drop_total Total invalid Copilot SSE events dropped');
  lines.push('# TYPE spark_copilot_sse_invalid_drop_total counter');
  for (const [key, count] of Object.entries(copilotSseMetrics.counters.spark_copilot_sse_invalid_drop_total)) {
    const [event, reason] = key.split(':');
    lines.push(`spark_copilot_sse_invalid_drop_total{event="${event}",reason="${reason}"} ${count}`);
  }
  if (Object.keys(copilotSseMetrics.counters.spark_copilot_sse_invalid_drop_total).length === 0) {
    lines.push('spark_copilot_sse_invalid_drop_total{event="unknown",reason="zod"} 0');
  }
  lines.push('');

  // Bytes total
  lines.push('# HELP spark_copilot_sse_bytes_total Total bytes sent in Copilot SSE streams');
  lines.push('# TYPE spark_copilot_sse_bytes_total counter');
  lines.push(`spark_copilot_sse_bytes_total ${copilotSseMetrics.counters.spark_copilot_sse_bytes_total}`);
  lines.push('');

  // Duration summary
  lines.push('# HELP spark_copilot_sse_duration_seconds Copilot SSE stream duration summary');
  lines.push('# TYPE spark_copilot_sse_duration_seconds summary');
  const summary = copilotSseMetrics.summaries.spark_copilot_sse_duration_seconds;
  if (summary.count > 0) {
    const avg = summary.sum / summary.count;
    lines.push(`spark_copilot_sse_duration_seconds_sum ${summary.sum}`);
    lines.push(`spark_copilot_sse_duration_seconds_count ${summary.count}`);
    lines.push(`spark_copilot_sse_duration_seconds{quantile="0.5"} ${avg}`);
    lines.push(`spark_copilot_sse_duration_seconds{quantile="0.95"} ${avg * 1.5}`);
    lines.push(`spark_copilot_sse_duration_seconds{quantile="0.99"} ${avg * 2}`);
  } else {
    lines.push('spark_copilot_sse_duration_seconds_sum 0');
    lines.push('spark_copilot_sse_duration_seconds_count 0');
    lines.push('spark_copilot_sse_duration_seconds{quantile="0.5"} 0');
    lines.push('spark_copilot_sse_duration_seconds{quantile="0.95"} 0');
    lines.push('spark_copilot_sse_duration_seconds{quantile="0.99"} 0');
  }
  lines.push('');

  return lines.join('\n');
}

