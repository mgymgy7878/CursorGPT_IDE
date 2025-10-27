'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Strategy = {
  id: string;
  name: string;
  category: 'Trend Takip' | 'Scalping' | 'Arbitraj' | 'Özel';
  description?: string;
  code?: string;
};

type Running = { id: string; name: string; status: 'starting' | 'running' | 'stopped' };

type S = {
  strategies: Strategy[];
  running: Running[];
  addStrategy: (p: Partial<Strategy>) => void;
  removeStrategy: (id: string) => void;
  runStrategy: (id: string) => void;
  backtestStrategy: (id: string) => void;
  optimizeStrategy: (id: string) => void;
};

export const useStrategiesStore = create<S>()(
  persist(
    (set, get) => ({
      strategies: [
        { id: 's1', name: 'BTC Trend Follower', category: 'Trend Takip', description: 'EMA cross' },
        { id: 's2', name: 'ETH Scalper', category: 'Scalping', description: 'micro mean-revert' },
      ],
      running: [],
      addStrategy: (p) =>
        set(s => ({
          strategies: [
            ...s.strategies,
            {
              id: crypto.randomUUID(),
              name: p.name ?? 'Yeni Strateji',
              category: (p.category as any) ?? 'Özel',
              description: p.description,
              code: p.code,
            },
          ],
        })),
      removeStrategy: (id) => set(s => ({ strategies: s.strategies.filter(x => x.id !== id) })),
      runStrategy: (id) => {
        const st = get().strategies.find(x => x.id === id);
        if (!st) return;
        set(s => ({ running: [...s.running, { id: st.id, name: st.name, status: 'running' }] }));
      },
      backtestStrategy: (id) => console.log('backtest', id), // stub
      optimizeStrategy: (id) => console.log('optimize', id), // stub
    }),
    { name: 'spark-strategies' }
  )
);
