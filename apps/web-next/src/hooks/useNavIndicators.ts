/**
 * useNavIndicators - Terminal-style navigation badge data
 *
 * Provides badge indicators for left sidebar and right rail based on app state
 */

'use client';

import { useState, useEffect } from 'react';

export interface NavIndicator {
  type: 'dot' | 'number' | 'pulse';
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  value?: number | string;
}

export interface NavIndicators {
  routes: Record<string, NavIndicator | null>;
  rightRail: {
    bell?: NavIndicator | null;
    shield?: NavIndicator | null;
    spark?: NavIndicator | null;
  };
}

// Real data sources from API
function useIndicators() {
  const [data, setData] = useState<{
    strategies: { active: number; _mock: boolean };
    positions: { open: number; _mock: boolean };
    audit: { recent: number; _mock: boolean };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchIndicators = async () => {
      try {
        const res = await fetch('/api/indicators', { cache: 'no-store' });
        if (res.ok && !cancelled) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        if (!cancelled) {
          setData({
            strategies: { active: 0, _mock: true },
            positions: { open: 0, _mock: true },
            audit: { recent: 0, _mock: true },
          });
        }
      }
    };

    fetchIndicators();
    const interval = setInterval(fetchIndicators, 30000); // Refresh every 30s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return data;
}

function useAlertsCount(): number {
  // TODO: Connect to alerts API
  const [count, setCount] = useState(0);
  useEffect(() => {
    // Mock for now
    setCount(0);
  }, []);
  return count;
}

function useRiskLevel(): 'low' | 'medium' | 'high' {
  // TODO: Connect to risk API
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
  useEffect(() => {
    // Mock for now
    setLevel('medium');
  }, []);
  return level;
}

function useRunningCount(): number {
  const indicators = useIndicators();
  return indicators?.strategies.active ?? 0;
}

function useDegradeCount(): number {
  // TODO: Calculate from strategies health status
  const [count, setCount] = useState(0);
  useEffect(() => {
    // Mock for now - should fetch strategies with health=degraded
    setCount(0);
  }, []);
  return count;
}

function useMisconfigCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // Mock: check settings
    setCount(2);
  }, []);
  return count;
}

function useWsHealth(): 'healthy' | 'degraded' | 'down' {
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');
  useEffect(() => {
    // Mock: check WS status
    setHealth('healthy');
  }, []);
  return health;
}

function useStrongBuyCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // Mock: fetch from market data
    setCount(5);
  }, []);
  return count;
}

export function useNavIndicators(): NavIndicators {
  const alertsCount = useAlertsCount();
  const riskLevel = useRiskLevel();
  const runningCount = useRunningCount();
  const degradeCount = useDegradeCount();
  const misconfigCount = useMisconfigCount();
  const wsHealth = useWsHealth();
  const strongBuyCount = useStrongBuyCount();
  const indicators = useIndicators();
  const openPositions = indicators?.positions.open ?? 0;

  return {
    routes: {
      '/dashboard': {
        type: 'dot',
        variant: riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'success',
      },
      '/market-data': {
        type: 'number',
        variant: 'info',
        value: strongBuyCount,
      },
      '/strategies': {
        type: 'number',
        variant: 'info',
        value: runningCount > 0 ? runningCount : undefined,
      },
      '/running': {
        type: 'number',
        variant: degradeCount > 0 ? 'warning' : 'success',
        value: openPositions > 0 ? openPositions : undefined,
      },
      '/control': {
        type: 'dot',
        variant: riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'success',
      },
      '/settings': {
        type: 'number',
        variant: misconfigCount > 0 ? 'warning' : 'neutral',
        value: misconfigCount > 0 ? misconfigCount : undefined,
      },
    },
    rightRail: {
      bell: alertsCount > 0
        ? {
            type: 'number',
            variant: 'warning',
            value: alertsCount,
          }
        : null,
      shield: {
        type: 'dot',
        variant: riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'success',
      },
      spark: wsHealth === 'down'
        ? {
            type: 'pulse',
            variant: 'danger',
          }
        : wsHealth === 'degraded'
        ? {
            type: 'dot',
            variant: 'warning',
          }
        : null,
    },
  };
}

