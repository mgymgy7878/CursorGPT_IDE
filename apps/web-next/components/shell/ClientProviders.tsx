'use client';
import React from "react";
import { ExchangeProvider } from "@/contexts/ExchangeContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ExchangeProvider>
      {children}
    </ExchangeProvider>
  );
} 