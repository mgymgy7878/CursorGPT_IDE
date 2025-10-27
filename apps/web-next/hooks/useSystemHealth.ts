import { useState, useEffect } from 'react';

export interface SystemHealth {
  metrics: 'UP' | 'DOWN' | 'CHECKING';
  executor: 'UP' | 'DOWN' | 'CHECKING';
  lastCheck: number;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const [metricsResult, executorResult] = await Promise.allSettled([
    fetch('/api/public/metrics/prom', { method: 'HEAD' }),
    fetch('/api/public/health', { method: 'HEAD' })
  ]);

  return {
    metrics: metricsResult.status === 'fulfilled' && metricsResult.value.ok ? 'UP' : 'DOWN',
    executor: executorResult.status === 'fulfilled' && executorResult.value.ok ? 'UP' : 'DOWN',
    lastCheck: Date.now()
  };
}

export function useSystemHealth(intervalMs: number = 30000) {
  const [health, setHealth] = useState<SystemHealth>({
    metrics: 'CHECKING',
    executor: 'CHECKING',
    lastCheck: 0
  });

  const checkHealth = async () => {
    try {
      const newHealth = await getSystemHealth();
      setHealth(newHealth);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth(prev => ({
        ...prev,
        metrics: 'DOWN',
        executor: 'DOWN',
        lastCheck: Date.now()
      }));
    }
  };

  useEffect(() => {
    checkHealth(); // Initial check
    const interval = setInterval(checkHealth, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return { health, checkHealth };
}
