"use client";
import { useEffect } from "react";
import { useTickers } from "../store/tickers";

const symbols = ["BTCUSDT", "ETHUSDT", "THYAO", "ASELS", "XAUUSD", "EURUSD"];

export function useMockWS() {
  const setState = (useTickers as any).setState;
  useEffect(() => {
    const id = setInterval(() => {
      setState((s: any) => {
        const now = Date.now();
        const t: Record<string, number> = { ...s.tickers };
        symbols.forEach((sym) => {
          t[sym] = (t[sym] ?? 100) * (1 + (Math.random() - 0.5) * 0.002);
        });
        return { tickers: t, lastTs: now };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [setState]);
}


