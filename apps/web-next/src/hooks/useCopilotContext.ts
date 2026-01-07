/**
 * useCopilotContext - Route bazlı bağlam toplama
 *
 * PATCH G: Context-aware Copilot için sayfa bağlamını toplar
 * - Market Data: symbol, timeframe, price, change, RSI
 * - Strategies: strategyId, health, risk, pnl
 * - Running: exposure, open positions
 */

'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useMarketStore } from '@/stores/marketStore';
import { getSparkMode, getExchangeNetwork, getBuildCommit } from '@/lib/spark/config';

export interface CopilotContext {
  route: string;
  symbol?: string;
  timeframe?: string;
  price?: number;
  change?: number;
  rsi?: number;
  strategyId?: string;
  strategyName?: string;
  health?: string;
  risk?: string;
  pnl?: number;
  exposure?: number;
  openPositions?: number;
  // Test mode context (her mesajda enjekte edilir)
  sparkMode?: string;
  exchange?: string;
  network?: string | null;
  buildCommit?: string;
}

export function useCopilotContext(): CopilotContext {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const marketStore = useMarketStore();

  const context: CopilotContext = {
    route: pathname || '',
  };

  // Market Data context
  if (pathname?.includes('/market-data')) {
    const symbol = searchParams?.get('symbol') || undefined;
    const timeframe = searchParams?.get('timeframe') || searchParams?.get('tf') || undefined;

    if (symbol) {
      context.symbol = symbol;
      context.timeframe = timeframe;

      // Market data from store
      const ticker = marketStore.tickers[symbol];
      if (ticker) {
        // Ticker structure may vary - use any available price field
        context.price = (ticker as any).last || (ticker as any).price || undefined;
        context.change = (ticker as any).change24h || (ticker as any).change || undefined;
        // RSI would come from technical indicators store if available
      }
    }
  }

  // Strategy Lab context
  if (pathname?.includes('/strategy-lab')) {
    const strategyId = searchParams?.get('strategyId') || undefined;
    if (strategyId) {
      context.strategyId = strategyId;
      // Strategy name would come from strategy store if available
    }
  }

  // Running Strategies context
  if (pathname?.includes('/running')) {
    // Mock data - would come from running strategies store
    context.exposure = 35500; // Example
    context.openPositions = 10; // Example
  }

  // Strategies context
  if (pathname?.includes('/strategies')) {
    const strategyId = searchParams?.get('strategyId') || undefined;
    if (strategyId) {
      context.strategyId = strategyId;
      // Strategy details would come from strategies store if available
    }
  }

  // Dashboard context - PATCH H: Primary strategy detection
  if (pathname?.includes('/dashboard') || pathname === '/') {
    // Mock: First running strategy (would come from strategies store)
    // For now, use a default primary strategy
    context.strategyName = 'BTCUSDT – Trend Follower v1';
    context.strategyId = 'primary';
  }

  // Test mode context (her zaman ekle - Copilot "prod/testnet/paper" farkını bilmeli)
  if (typeof window !== 'undefined') {
    context.sparkMode = getSparkMode();
    context.exchange = process.env.NEXT_PUBLIC_EXCHANGE || process.env.EXCHANGE || undefined;
    context.network = getExchangeNetwork();
    context.buildCommit = getBuildCommit();
  }

  return context;
}

/**
 * Format context into a readable string for prompt injection
 */
export function formatContextForPrompt(context: CopilotContext): string {
  const parts: string[] = [];

  if (context.symbol) {
    parts.push(`Sembol: ${context.symbol}`);
  }
  if (context.timeframe) {
    parts.push(`Timeframe: ${context.timeframe}`);
  }
  if (context.price !== undefined) {
    parts.push(`Fiyat: $${context.price.toLocaleString()}`);
  }
  if (context.change !== undefined) {
    parts.push(`Değişim: ${context.change > 0 ? '+' : ''}${context.change.toFixed(2)}%`);
  }
  if (context.rsi !== undefined) {
    parts.push(`RSI: ${context.rsi.toFixed(1)}`);
  }
  if (context.strategyId) {
    parts.push(`Strateji ID: ${context.strategyId}`);
  }
  if (context.strategyName) {
    parts.push(`Strateji: ${context.strategyName}`);
  }
  if (context.health) {
    parts.push(`Sağlık: ${context.health}`);
  }
  if (context.risk) {
    parts.push(`Risk: ${context.risk}`);
  }
  if (context.pnl !== undefined) {
    parts.push(`PnL: ${context.pnl > 0 ? '+' : ''}$${context.pnl.toLocaleString()}`);
  }
  if (context.exposure !== undefined) {
    parts.push(`Exposure: $${context.exposure.toLocaleString()}`);
  }
  if (context.openPositions !== undefined) {
    parts.push(`Açık Pozisyon: ${context.openPositions}`);
  }

  // Test mode context (sistem/hidden context - kullanıcı mesajını kirletmez)
  const systemParts: string[] = [];
  if (context.sparkMode) {
    systemParts.push(`sparkMode=${context.sparkMode}`);
  }
  if (context.exchange) {
    systemParts.push(`exchange=${context.exchange}`);
  }
  if (context.network) {
    systemParts.push(`network=${context.network}`);
  }
  if (context.buildCommit) {
    systemParts.push(`buildCommit=${context.buildCommit}`);
  }

  const userContext = parts.length > 0 ? `[Bağlam: ${parts.join(', ')}]` : '';
  const systemContext = systemParts.length > 0 ? `[Sistem: ${systemParts.join(', ')}]` : '';

  // System context'i hidden olarak ekle (Copilot'a bilgi verir ama kullanıcıya gösterilmez)
  return userContext + (systemContext ? `\n${systemContext}` : '');
}

