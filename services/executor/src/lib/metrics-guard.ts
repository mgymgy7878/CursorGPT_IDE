// Runtime Guard for Unexpected Labels - Route Label "Bir Daha Asla" Protection
// Bu modül, beklenmeyen label kullanımlarını yakalar ve sayaç tutar

import * as prom from "./metrics.js";

// Unexpected label counter
export const unexpectedLabelsTotal = new prom.Counter({
  name: 'spark_metrics_unexpected_labels_total',
  help: 'Unexpected label usage in metrics (route label guardrail)',
  labelNames: ['metric_name', 'unexpected_label', 'expected_labels'],
  registers: [prom.registry],
});

// Safe labels wrapper
export function safeLabels<T extends { labels: Function }>(
  metric: T, 
  metricName: string, 
  allowedLabels: string[]
): T {
  const originalLabels = metric.labels.bind(metric);
  
  metric.labels = (labelValues: Record<string, any>) => {
    const providedLabels = Object.keys(labelValues || {});
    const unexpectedLabels = providedLabels.filter(label => !allowedLabels.includes(label));
    
    if (unexpectedLabels.length > 0) {
      // Log warning
      console.warn(`[metrics-guard] Unexpected labels in ${metricName}:`, {
        unexpected: unexpectedLabels,
        expected: allowedLabels,
        provided: providedLabels
      });
      
      // Increment counter
      unexpectedLabelsTotal.inc({
        metric_name: metricName,
        unexpected_label: unexpectedLabels.join(','),
        expected_labels: allowedLabels.join(',')
      });
    }
    
    return originalLabels(labelValues);
  };
  
  return metric;
}

// Predefined label sets for common metrics
export const LABEL_SETS = {
  HTTP: ['method', 'route', 'status'],
  AI: ['model', 'status'],
  EXCHANGE: ['exchange', 'symbol', 'side'],
  CANARY: ['route', 'status', 'reason'],
  GENERIC: ['status']
} as const;

// Helper function to wrap existing metrics
export function wrapMetricWithGuard<T extends { labels: Function }>(
  metric: T,
  metricName: string,
  labelSet: keyof typeof LABEL_SETS | string[]
): T {
  const allowedLabels = Array.isArray(labelSet) ? labelSet : LABEL_SETS[labelSet];
  return safeLabels(metric, metricName, allowedLabels);
}
