/**
 * RightRailContext - RightRail içeriğini sayfalardan AppFrame'e geçirmek için
 *
 * Kullanım:
 * <RightRailProvider value={<AlarmCard />}>
 *   <DashboardClient />
 * </RightRailProvider>
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';

const RightRailContext = createContext<ReactNode | null>(null);

export function RightRailProvider({ children, value }: { children: ReactNode; value?: ReactNode }) {
  return (
    <RightRailContext.Provider value={value || null}>
      {children}
    </RightRailContext.Provider>
  );
}

export function useRightRail() {
  return useContext(RightRailContext);
}

