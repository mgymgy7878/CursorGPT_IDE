"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type LabState = {
  code: string;
  params: Record<string, number | string>;
  backtest?: {
    equity: Array<{ t: number; eq: number }>;
    metrics: {
      totalReturn: number;
      winRate: number;
      sharpeRatio: number;
      maxDrawdown: number;
      totalTrades: number;
    };
  };
  optimize?: {
    best: Array<{
      params: Record<string, number>;
      metrics: {
        totalReturn: number;
        winRate: number;
        sharpeRatio: number;
      };
    }>;
  };
  model?: "openai" | "claude";
  selectedOptimization?: number; // Index of selected optimization result
};

type LabContextType = {
  state: LabState;
  setCode: (code: string) => void;
  setParams: (params: Record<string, number | string>) => void;
  setBacktest: (backtest: LabState["backtest"]) => void;
  setOptimize: (optimize: LabState["optimize"]) => void;
  setModel: (model: "openai" | "claude") => void;
  setSelectedOptimization: (index: number) => void;
  reset: () => void;
};

const defaultState: LabState = {
  code: `// Strategy Template
export const config = {
  indicators: { 
    emaFast: 20, 
    emaSlow: 50, 
    atr: 14 
  },
  entry: { 
    type: 'crossUp', 
    fast: 'EMA', 
    slow: 'EMA' 
  },
  exit: { 
    atrMult: 2, 
    takeProfitRR: 1.5 
  },
  feesBps: 5, 
  slippageBps: 1
};`,
  params: {
    emaFast: 20,
    emaSlow: 50,
    atr: 14,
    atrMult: 2,
    takeProfitRR: 1.5
  }
};

const LabContext = createContext<LabContextType | undefined>(undefined);

export function LabProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LabState>(defaultState);

  const setCode = (code: string) => {
    setState(prev => ({ ...prev, code }));
  };

  const setParams = (params: Record<string, number | string>) => {
    setState(prev => ({ ...prev, params }));
  };

  const setBacktest = (backtest: LabState["backtest"]) => {
    setState(prev => ({ ...prev, backtest }));
  };

  const setOptimize = (optimize: LabState["optimize"]) => {
    setState(prev => ({ ...prev, optimize }));
  };

  const setModel = (model: "openai" | "claude") => {
    setState(prev => ({ ...prev, model }));
  };

  const setSelectedOptimization = (index: number) => {
    setState(prev => ({ ...prev, selectedOptimization: index }));
  };

  const reset = () => {
    setState(defaultState);
  };

  return (
    <LabContext.Provider value={{
      state,
      setCode,
      setParams,
      setBacktest,
      setOptimize,
      setModel,
      setSelectedOptimization,
      reset
    }}>
      {children}
    </LabContext.Provider>
  );
}

export function useLab() {
  const context = useContext(LabContext);
  if (context === undefined) {
    throw new Error("useLab must be used within a LabProvider");
  }
  return context;
}
