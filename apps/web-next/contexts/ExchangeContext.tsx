'use client';

import React from "react";

export type Exchange = 'auto' | 'binance' | 'btcturk';

type Ctx = {
  exchange: Exchange;
  setExchange: (v: Exchange) => void;
  resolved: ExResolved;
};

export type ExResolved = 'binance' | 'btcturk';

const KEY = 'ui:exchange';
const DEF_ENV = (process.env.NEXT_PUBLIC_DEFAULT_EXCHANGE ?? 'binance')
  .toLowerCase()
  .replace(/\s+/g, '') as ExResolved;

function resolveExchange(x: Exchange): ExResolved {
  if (x === 'auto') return (DEF_ENV === 'btcturk' ? 'btcturk' : 'binance');
  return x;
}

const ExchangeContext = React.createContext<Ctx | null>(null);

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const [exchange, setExchange] = React.useState<Exchange>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? '"auto"');
      return (v === 'binance' || v === 'btcturk' || v === 'auto') ? v : 'auto';
    } catch { return 'auto'; }
  });

  React.useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(exchange)); } catch {}
  }, [exchange]);

  const value = React.useMemo<Ctx>(() => ({
    exchange,
    setExchange,
    resolved: resolveExchange(exchange),
  }), [exchange]);

  return <ExchangeContext.Provider value={value}>{children}</ExchangeContext.Provider>;
}

export function useExchange(): Ctx {
  const ctx = React.useContext(ExchangeContext);
  if (!ctx) throw new Error('useExchange must be used within <ExchangeProvider>');
  return ctx;
}

export { resolveExchange }; 