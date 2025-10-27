'use client';

import { ExchangeProvider } from '@/contexts/ExchangeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ExchangeProvider>
      {children}
    </ExchangeProvider>
  );
}
