"use client";
import { create } from "zustand";

type UIState = {
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  copilotOpen: true,
  setCopilotOpen: (open: boolean) => set({ copilotOpen: open }),
  toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),
}));


