import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketTab } from './contracts';

type TerminalState = {
  selectedSymbol: string;
  marketTab: MarketTab;
  searchQuery: string;
  favorites: Record<string, boolean>;
  setSelectedSymbol: (symbol: string) => void;
  setMarketTab: (tab: MarketTab) => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (symbol: string) => void;
};

const DEFAULT_SYMBOL = 'BTCUSDT';

export const useTerminalState = create<TerminalState>()(
  persist(
    (set, get) => ({
      selectedSymbol: DEFAULT_SYMBOL,
      marketTab: 'favorites',
      searchQuery: '',
      favorites: {
        BTCUSDT: true,
        ETHUSDT: true,
      },
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
      setMarketTab: (tab) => set({ marketTab: tab }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleFavorite: (symbol) => {
        const { favorites } = get();
        const next = { ...favorites, [symbol]: !favorites[symbol] };
        set({ favorites: next });
      },
    }),
    {
      name: 'terminal.state.v1',
      partialize: (state) => ({
        selectedSymbol: state.selectedSymbol,
        marketTab: state.marketTab,
        favorites: state.favorites,
      }),
    }
  )
);
