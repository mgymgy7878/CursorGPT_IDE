/**
 * Health status utilities
 * Single source of truth for system status indicators
 */

export type HealthStatus = 'ok' | 'warn' | 'error' | 'offline' | 'unknown';

export interface SystemMetrics {
  environment: 'production' | 'staging' | 'development' | 'mock';
  wsConnected: boolean;
  wsStalenessMs?: number;
  brokerConnected: boolean;
  lastBrokerPingMs?: number;
}

export interface StatusPillConfig {
  env: { label: string; value: string; status: HealthStatus };
  feed: { label: string; value: string; status: HealthStatus };
  broker: { label: string; value: string; status: HealthStatus };
}

/**
 * Get health status from system metrics
 * Used in status pills across pages
 */
export function getHealthStatus(metrics: SystemMetrics): StatusPillConfig {
  // Environment status
  const envStatus: HealthStatus = 
    metrics.environment === 'production' ? 'ok' :
    metrics.environment === 'staging' ? 'warn' :
    metrics.environment === 'mock' ? 'unknown' : 'error';

  const envLabel = 
    metrics.environment === 'production' ? 'Production' :
    metrics.environment === 'staging' ? 'Staging' :
    metrics.environment === 'development' ? 'Development' : 'Mock';

  // Feed status (WebSocket staleness)
  const staleness = metrics.wsStalenessMs || 0;
  const feedStatus: HealthStatus = 
    !metrics.wsConnected ? 'offline' :
    staleness < 5000 ? 'ok' :
    staleness < 30000 ? 'warn' : 'error';

  const feedLabel = 
    !metrics.wsConnected ? 'Disconnected' :
    staleness < 5000 ? 'Healthy' :
    `Stale (${Math.floor(staleness / 1000)}s)`;

  // Broker status
  const brokerPing = metrics.lastBrokerPingMs || Infinity;
  const brokerStatus: HealthStatus = 
    !metrics.brokerConnected ? 'offline' :
    brokerPing < 10000 ? 'ok' : 'warn';

  const brokerLabel = 
    !metrics.brokerConnected ? 'Offline' :
    brokerPing < 10000 ? 'Online' : `Slow (${Math.floor(brokerPing)}ms)`;

  return {
    env: { label: 'Env', value: envLabel, status: envStatus },
    feed: { label: 'Feed', value: feedLabel, status: feedStatus },
    broker: { label: 'Broker', value: brokerLabel, status: brokerStatus },
  };
}

/**
 * Get CSS class for status indicator
 */
export function getStatusClass(status: HealthStatus): string {
  const classes = {
    ok: 'bg-success/10 text-success border-success/20',
    warn: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-danger/10 text-danger border-danger/20',
    offline: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    unknown: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  
  return classes[status];
}

/**
 * Mock metrics for development
 */
export const MOCK_METRICS: SystemMetrics = {
  environment: 'mock',
  wsConnected: true,
  wsStalenessMs: 2000,
  brokerConnected: false,
  lastBrokerPingMs: undefined,
};

