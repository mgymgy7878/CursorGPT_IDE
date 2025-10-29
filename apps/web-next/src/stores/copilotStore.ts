import { create } from "zustand";

type CopilotMode = "analysis" | "manage" | "strategy";

interface CopilotState {
  open: boolean;
  mode: CopilotMode;
  openWith: (mode: CopilotMode) => void;
  toggle: () => void;
  close: () => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
  open: false,
  mode: "analysis",

  openWith: (mode) => set({ open: true, mode }),
  toggle: () => set((state) => ({ open: !state.open })),
  close: () => set({ open: false }),
}));
