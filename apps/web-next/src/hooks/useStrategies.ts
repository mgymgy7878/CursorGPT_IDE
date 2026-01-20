import { useState, useEffect, useCallback } from 'react';

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'paused' | 'running';
  createdAt: string;
  updatedAt: string;
  type: 'manual' | 'automated';
  riskLevel: 'low' | 'medium' | 'high';
  profitLoss?: number;
  tradesCount?: number;
}

export interface CreateStrategyPayload {
  name: string;
  description?: string;
  type: 'manual' | 'automated';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface UpdateStrategyPayload {
  name?: string;
  description?: string;
  type?: 'manual' | 'automated';
  riskLevel?: 'low' | 'medium' | 'high';
}

export const useStrategies = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const useMock = (process.env.NEXT_PUBLIC_USE_MOCK === '1');
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || '';
  const prefix = process.env.NEXT_PUBLIC_STRATEGIES_PREFIX || '/api/strategies';
  const mockBase = '/api/public/strategies-mock';

  // Fetch strategies list
  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try real API first, fallback to mock
      const url = useMock ? mockBase : `${apiBase}${prefix}/list`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        // Fallback to mock endpoint
        const mockResponse = await fetch(mockBase, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!mockResponse.ok) {
          throw new Error('Failed to fetch strategies');
        }
        
        const mockData = await mockResponse.json();
        setStrategies(mockData.strategies || []);
        return;
      }
      
      const data = await response.json();
      setStrategies(data.strategies || data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch strategies');
      // Set mock data on error (MVP: include ema_rsi_v1)
      setStrategies([
        {
          id: 'ema_rsi_v1',
          name: 'EMA+RSI v1',
          description: 'EMA(12/26) crossover with RSI(14) filter. Long entry: EMA12 > EMA26 AND RSI < 70. Exit: EMA12 < EMA26 OR RSI > 75.',
          status: 'inactive',
          type: 'automated',
          riskLevel: 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '1',
          name: 'Sample Strategy 1',
          description: 'A sample trading strategy',
          status: 'active',
          type: 'automated',
          riskLevel: 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profitLoss: 1250.50,
          tradesCount: 45,
        },
        {
          id: '2',
          name: 'Sample Strategy 2',
          description: 'Another sample strategy',
          status: 'paused',
          type: 'manual',
          riskLevel: 'low',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profitLoss: -320.25,
          tradesCount: 12,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new strategy
  const create = useCallback(async (payload: CreateStrategyPayload): Promise<Strategy> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(useMock ? `${mockBase}?action=create` : `${apiBase}${prefix}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        // Fallback to mock endpoint
        const mockResponse = await fetch(mockBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!mockResponse.ok) {
          throw new Error('Failed to create strategy');
        }
        
        const mockData = await mockResponse.json();
        const newStrategy = mockData.strategy;
        setStrategies(prev => [...prev, newStrategy]);
        return newStrategy;
      }
      
      const data = await response.json();
      const newStrategy = data.strategy || data.item;
      setStrategies(prev => [...prev, newStrategy]);
      return newStrategy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create strategy';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update strategy
  const update = useCallback(async (id: string, payload: UpdateStrategyPayload): Promise<Strategy> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(useMock ? `${mockBase}?action=update` : `${apiBase}${prefix}/update`, {
        method: useMock ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      
      if (!response.ok) {
        // Fallback to mock endpoint
        const mockResponse = await fetch(`${mockBase}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!mockResponse.ok) {
          throw new Error('Failed to update strategy');
        }
        
        const mockData = await mockResponse.json();
        const updatedStrategy = mockData.strategy;
        setStrategies(prev => prev.map(s => s.id === id ? updatedStrategy : s));
        return updatedStrategy;
      }
      
      const data = await response.json();
      const updatedStrategy = data.strategy || data.item;
      setStrategies(prev => prev.map(s => s.id === id ? updatedStrategy : s));
      return updatedStrategy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update strategy';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete strategy
  const remove = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(useMock ? `${mockBase}?action=delete` : `${apiBase}${prefix}/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      
      if (!response.ok) {
        // Fallback to mock endpoint
        const mockResponse = await fetch(`${mockBase}/${id}`, { method: 'DELETE' });
        
        if (!mockResponse.ok) {
          throw new Error('Failed to delete strategy');
        }
      }
      
      setStrategies(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete strategy';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set strategy status
  const setStatus = useCallback(async (id: string, status: 'start' | 'stop' | 'pause'): Promise<Strategy> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(useMock ? `${mockBase}?action=status` : `${apiBase}${prefix}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: status }) });
      
      if (!response.ok) {
        // Fallback to mock endpoint
        const mockResponse = await fetch(`${mockBase}/${id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        
        if (!mockResponse.ok) {
          throw new Error('Failed to update strategy status');
        }
        
        const mockData = await mockResponse.json();
        const updatedStrategy = mockData.strategy;
        setStrategies(prev => prev.map(s => s.id === id ? updatedStrategy : s));
        return updatedStrategy;
      }
      
      const data = await response.json();
      const updatedStrategy = data.strategy || data.item;
      setStrategies(prev => prev.map(s => s.id === id ? updatedStrategy : s));
      return updatedStrategy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update strategy status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load strategies on mount
  useEffect(() => {
    list();
  }, [list]);

  return {
    strategies,
    loading,
    error,
    list,
    create,
    update,
    remove,
    setStatus,
  };
};
