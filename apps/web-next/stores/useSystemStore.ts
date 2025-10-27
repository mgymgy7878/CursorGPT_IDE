"use client";
import { create } from "zustand";
import { SystemHealth, startHealthPolling, fetchSystemHealth } from "@/lib/api/health";

type ConnStatus = "idle" | "loading" | "live" | "error";

type State = {
  status: ConnStatus;
  health: SystemHealth | null;
  lastUpdate: number | null;
  lastError: string | null;
  unsubscribe?: () => void;
};

type Actions = {
  start: () => void;
  stop: () => void;
};

export const useSystemStore = create<State & Actions>((set, get) => ({
  status: "idle",
  health: null,
  lastUpdate: null,
  lastError: null,

  start: () => {
    if (get().unsubscribe) return;
    set({ status: "loading", lastError: null });
    const unsub = startHealthPolling({
      intervalMs: 5000,
      onData: (h) => {
        set({ status: "live", health: h, lastUpdate: Number(h.ts) ?? Date.now(), lastError: null });
      },
      onError: (e) => set({ status: "error", lastError: String(e) }),
    });
    set({ unsubscribe: unsub });
  },

  stop: () => {
    get().unsubscribe?.();
    set({ unsubscribe: undefined, status: "idle" });
  },
}));
