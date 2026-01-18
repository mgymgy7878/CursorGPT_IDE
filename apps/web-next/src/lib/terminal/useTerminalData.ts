import useSWR from 'swr';
import type { OrderBook, TickerRow, DataQuality } from './contracts';

type MarketWatchResponse = {
  dataQuality: DataQuality;
  tickers: TickerRow[];
  _meta?: { source?: string };
};

type OrderBookResponse = {
  dataQuality: DataQuality;
  orderBook: OrderBook;
  _meta?: { source?: string };
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.statusText}`);
  }
  return res.json();
};

export function useMarketWatchData(seed?: boolean) {
  const query = seed ? '?seed=1' : '';
  return useSWR<MarketWatchResponse>(
    `/api/terminal/market-watch${query}`,
    fetcher,
    {
      refreshInterval: 1200,
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    }
  );
}

export function useOrderBook(symbol: string, seed?: boolean) {
  const query = `?symbol=${encodeURIComponent(symbol)}${seed ? '&seed=1' : ''}`;
  return useSWR<OrderBookResponse>(
    `/api/terminal/orderbook${query}`,
    fetcher,
    {
      refreshInterval: 900,
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    }
  );
}
