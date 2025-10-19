export interface MetricsData {
  [metricName: string]: {
    value: number;
    timestamp: number;
  };
}

export interface PrometheusMetric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface HealthData {
  status: string;
  service: string;
  timestamp: number;
  error?: string;
}

export interface ServiceMetrics {
  [service: string]: MetricsData;
}

export interface HealthStatus {
  [service: string]: HealthData;
}
