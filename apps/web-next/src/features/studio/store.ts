import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StrategyWizardState {
  // Step 1: Parameters
  symbol: string;
  timeframe: string;
  risk: "conservative" | "moderate" | "aggressive";
  notes: string;

  // Step 2: AI Suggestions
  suggestions: StrategySuggestion[];
  selectedSuggestion: StrategySuggestion | null;

  // Step 3: Generated Code
  generatedCode: string;

  // Actions
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;
  setRisk: (risk: "conservative" | "moderate" | "aggressive") => void;
  setNotes: (notes: string) => void;
  setSuggestions: (suggestions: StrategySuggestion[]) => void;
  selectSuggestion: (suggestion: StrategySuggestion | null) => void;
  setGeneratedCode: (code: string) => void;
  reset: () => void;
}

export interface StrategySuggestion {
  id: string;
  title: string;
  description: string;
  indicators: string[];
  rationale: string;
  riskLevel: "conservative" | "moderate" | "aggressive";
}

const initialState = {
  symbol: "BTC/USDT",
  timeframe: "1h",
  risk: "moderate" as const,
  notes: "",
  suggestions: [],
  selectedSuggestion: null,
  generatedCode: "",
};

export const useStrategyWizardStore = create<StrategyWizardState>()(
  persist(
    (set) => ({
      ...initialState,
      setSymbol: (symbol) => set({ symbol }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setRisk: (risk) => set({ risk }),
      setNotes: (notes) => set({ notes }),
      setSuggestions: (suggestions) => set({ suggestions }),
      selectSuggestion: (selectedSuggestion) => set({ selectedSuggestion }),
      setGeneratedCode: (generatedCode) => set({ generatedCode }),
      reset: () => set(initialState),
    }),
    {
      name: "strategy-wizard-state",
      partialize: (state) => ({
        symbol: state.symbol,
        timeframe: state.timeframe,
        risk: state.risk,
        notes: state.notes,
      }),
    }
  )
);
