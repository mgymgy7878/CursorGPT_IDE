import { create } from "zustand";

export type TState = {
  tickers: Record<string, number>;
  lastTs: number;
  paused: boolean;
  pause: () => void;
  resume: () => void;
};

export const useTickers = create<TState>((set) => ({
  tickers: {},
  lastTs: 0,
  paused: false,
  pause: () => set({ paused: true }),
  resume: () => set({ paused: false }),
}));


