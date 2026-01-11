"use client";

import type { ReactNode } from "react";
import MarketProvider from "@/providers/MarketProvider";

/**
 * Market Data Layout: MarketProvider scope'u
 * Sadece market-data route'ları için MarketProvider yüklenir
 * Bu sayede /dashboard gibi route'lar MarketProvider yüzünden şişmez
 */
export default function MarketDataLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MarketProvider>{children}</MarketProvider>;
}

