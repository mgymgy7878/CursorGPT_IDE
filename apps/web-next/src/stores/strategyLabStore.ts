import { create } from "zustand";

export type StrategyLabTab = "generate" | "backtest" | "optimize" | "deploy";

interface BacktestResult {
  sharpe?: number;
  maxDrawdown?: number;
  winRate?: number;
  totalReturn?: number;
  equityCurve?: Array<{ ts: number; value: number }>;
}

interface ParamSet {
  id: string;
  params: Record<string, any>;
  score: number;
  sharpe?: number;
}

interface StrategyLabState {
  // Current tab
  activeTab: StrategyLabTab;
  setActiveTab: (tab: StrategyLabTab) => void;

  // Generated strategy (from AI)
  strategyCode: string;
  strategyPrompt: string;
  indicators: string[];
  rules: string[];
  setStrategyCode: (code: string) => void;
  setStrategyPrompt: (prompt: string) => void;

  // Backtest results
  backtestResults: BacktestResult | null;
  setBacktestResults: (results: BacktestResult) => void;

  // Optimization
  optimizationLeaderboard: ParamSet[];
  bestParams: ParamSet | null;
  setBestParams: (params: ParamSet) => void;
  setLeaderboard: (leaderboard: ParamSet[]) => void;

  // Deployment
  deploymentConfig: {
    name: string;
    riskLimits: Record<string, number>;
    lotSize: number;
    canary: boolean;
  };
  setDeploymentConfig: (config: Partial<StrategyLabState["deploymentConfig"]>) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  activeTab: "generate" as StrategyLabTab,
  strategyCode: "",
  strategyPrompt: "",
  indicators: [],
  rules: [],
  backtestResults: null,
  optimizationLeaderboard: [],
  bestParams: null,
  deploymentConfig: {
    name: "",
    riskLimits: {},
    lotSize: 0.01,
    canary: true,
  },
};

export const useStrategyLabStore = create<StrategyLabState>((set) => ({
  ...initialState,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setStrategyCode: (code) => set({ strategyCode: code }),
  setStrategyPrompt: (prompt) => set({ strategyPrompt: prompt }),
  setBacktestResults: (results) => set({ backtestResults: results }),
  setBestParams: (params) => set({ bestParams: params }),
  setLeaderboard: (leaderboard) => set({ optimizationLeaderboard: leaderboard }),
  setDeploymentConfig: (config) =>
    set((state) => ({
      deploymentConfig: { ...state.deploymentConfig, ...config },
    })),
  reset: () => set(initialState),
}));

