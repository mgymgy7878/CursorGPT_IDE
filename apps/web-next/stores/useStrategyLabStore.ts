import { create } from "zustand";
// import type { OptimizeRequest, OptimizeResult } from "@spark/shared";
type OptimizeRequest = any;
type OptimizeResult = any;
// import { postJSON } from "@spark/shared";
const postJSON = async (url: string, data: any) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

type BacktestResultType = any;

type BaseParams = {
  symbol: string; timeframe: string;
  start: number; end: number;
  commission?: number; leverage?: number;
};

type State = {
  code: string;
  params: Record<string, number>;
  setCode: (code: string) => void;
  setParam: (k: string, v: number) => void;
  applyParams: (all: Record<string, number>) => void;
  // Lint/Compile
  linting: boolean;
  lintIssues: { severity: 'error'|'warn'; message: string }[];
  compiling: boolean;
  compileDiagnostics: any[];
  runLint: () => Promise<void>;
  runCompile: () => Promise<void>;
  // Save/Load
  saveRecipe: (name: string) => void;
  loadRecipe: (name: string) => boolean;
  listRecipes: () => string[];
  removeRecipe: (name: string) => void;

  // Assistant
  generating: boolean;
  generate: (prompt: string, action?: 'generate' | 'fix' | 'improve') => Promise<void>;

  // Backtest
  btRunning: boolean;
  btError?: string;
  btResult?: BacktestResultType;
  runBacktest: (base?: Partial<BaseParams>) => Promise<void>;

  // Optimize
  optRunning: boolean;
  optRunId?: string;
  optProgress?: { done: number; total: number; pct: number } | null;
  optBest?: { params: Record<string, number>; score: number } | null;
  optResult?: OptimizeResult;
  optError?: string;
  // Optimize Settings
  optSettings: {
    method: 'grid' | 'random';
    maxSamples: number;
    oosPercent: number;
    target: 'totalPnl' | 'sharpe' | 'winRate' | 'maxDrawdown';
    direction: 'asc' | 'desc';
    ranges?: Array<{ key: string; min: number; max: number; step?: number; values?: number[] }>;
  };
  setOptSettings: (patch: Partial<State['optSettings']>) => void;
  setOptRanges: (ranges: NonNullable<State['optSettings']['ranges']>) => void;
  regenRangesFromParams: () => void;
  runOptimize: (ranges?: Array<{ key: string; min: number; max: number; step?: number; values?: number[] }>, base?: Partial<BaseParams>) => Promise<void>;
  resetOptimize: () => void;
};

function defaultBase(): BaseParams {
  const now = Date.now();
  return {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    start: now - 30 * 24 * 60 * 60 * 1000,
    end: now,
    commission: 0.0004,
    leverage: 1
  };
}

function autoRangesFromParams(params: Record<string, number>) {
  const out: Array<{ key: string; min: number; max: number; step?: number }> = [];
  for (const [k, v0] of Object.entries(params || {})) {
    if (typeof v0 !== 'number' || !isFinite(v0)) continue;
    const v = v0 === 0 ? 1 : v0;
    const min = v > 0 ? v * 0.5 : v * 1.5;
    const max = v > 0 ? v * 1.5 : v * 0.5;
    const isInt = Math.abs(v - Math.round(v)) < 1e-9;
    const step = isInt ? Math.max(1, Math.round(Math.abs(v) / 10)) : Math.max(0.01, Math.abs(v) / 10);
    out.push({ key: k, min: Number(min.toFixed(6)), max: Number(max.toFixed(6)), step: Number(step.toFixed(6)) });
  }
  return out.length ? out : [{ key: 'period', min: 5, max: 50, step: 1 }];
}

export const useStrategyLabStore = create<State>((set, get) => ({
  code: '',
  params: {},
  setCode(code) { set({ code }); },
  setParam(k, v) {
    const next = { ...(get().params || {}), [k]: v };
    set({ params: next });
  },
  applyParams(all) {
    set({ params: { ...all } });
  },
  // --- Lint/Compile ---
  linting: false,
  lintIssues: [],
  compiling: false,
  compileDiagnostics: [],
  async runLint() {
    set({ linting: true });
    try {
      const out = await postJSON(
        '/api/strategy/lint',
        { code: get().code }
      ) as { issues: { severity: 'error'|'warn'; message: string }[] };
      set({ lintIssues: out.issues ?? [] });
    } catch {
      set({ lintIssues: [{ severity:'error', message:'lint failed' }] });
    } finally { set({ linting: false }); }
  },
  async runCompile() {
    set({ compiling: true });
    try {
      const out = await postJSON(
        '/api/strategy/compile',
        { code: get().code }
      ) as { diagnostics: any[] };
      set({ compileDiagnostics: out.diagnostics ?? [] });
    } catch {
      set({ compileDiagnostics: [{ message:'compile failed' }] as any });
    } finally { set({ compiling: false }); }
  },
  // --- Save/Load (localStorage) ---
  saveRecipe(name: string) {
    if (!name) return;
    if (typeof window === 'undefined') return;
    const key = 'strategyLab.recipes';
    const bag = JSON.parse(localStorage.getItem(key) || '{}');
    bag[name] = { code: get().code, params: get().params, ts: Date.now() };
    localStorage.setItem(key, JSON.stringify(bag));
  },
  loadRecipe(name: string) {
    if (!name || typeof window === 'undefined') return false;
    const bag = JSON.parse(localStorage.getItem('strategyLab.recipes') || '{}');
    const rec = bag[name];
    if (!rec) return false;
    set({ code: rec.code || '', params: rec.params || {} });
    return true;
  },
  listRecipes() {
    if (typeof window === 'undefined') return [];
    const bag = JSON.parse(localStorage.getItem('strategyLab.recipes') || '{}');
    return Object.keys(bag);
  },
  removeRecipe(name: string) {
    if (!name || typeof window === 'undefined') return;
    const key = 'strategyLab.recipes';
    const bag = JSON.parse(localStorage.getItem(key) || '{}');
    delete bag[name];
    localStorage.setItem(key, JSON.stringify(bag));
  },

  generating: false,
  async generate(prompt, action = 'generate') {
    set({ generating: true });
    try {
      const res = await postJSON('/api/strategy/assistant', { prompt, action }) as { code: string; params?: Record<string, number> };
      set({ code: res.code ?? '', params: res.params ?? {} });
      // generate sonrasında otomatik lint/compile
      await Promise.allSettled([ get().runLint(), get().runCompile() ]);
    } catch (e: any) {
      console.error('assistant failed', e?.message || e);
    } finally {
      set({ generating: false });
    }
  },

  // Backtest
  btRunning: false,
  btError: undefined,
  btResult: undefined,
  async runBacktest(base) {
    set({ btRunning: true, btError: undefined });
    try {
      const b = { ...defaultBase(), ...(base || {}) };
      // Not: backend şu an code'ı kullanmıyor olabilir; yine de gönderiyoruz
      const payload = { ...b, params: get().params, code: get().code };
      const out = await postJSON('/api/strategy/backtest', payload) as any;
      set({ btResult: out, btRunning: false });
    } catch (e: any) {
      set({ btError: e?.message ?? 'backtest failed', btRunning: false });
    }
  },

  // Optimize
  optRunning: false,
  optRunId: undefined,
  optProgress: null,
  optBest: null,
  optResult: undefined,
  optError: undefined,
  optSettings: {
    method: 'grid',
    maxSamples: 500,
    oosPercent: 0.2,
    target: 'totalPnl',
    direction: 'desc',
    ranges: undefined
  },
  setOptSettings(patch) {
    set({ optSettings: { ...get().optSettings, ...(patch || {}) } });
  },
  setOptRanges(ranges) {
    set({ optSettings: { ...get().optSettings, ranges } });
  },
  regenRangesFromParams() {
    const auto = autoRangesFromParams(get().params);
    set({ optSettings: { ...get().optSettings, ranges: auto } });
  },

  async runOptimize(ranges, base) {
    if (get().optRunning) return;
    set({ optRunning: true, optError: undefined, optResult: undefined, optProgress: { done: 0, total: 0, pct: 0 }, optBest: null });

    const runId = Math.random().toString(36).slice(2);
    set({ optRunId: runId });

    // SSE dinle
    const es = new EventSource(`/api/logs/sse?runId=${runId}`);
    const onStart = (ev: MessageEvent) => {
      const p = JSON.parse(ev.data);
      set({ optProgress: { done: 0, total: p.total, pct: 0 } });
    };
    const onProg = (ev: MessageEvent) => {
      const p = JSON.parse(ev.data);
      set({ optProgress: { done: p.done, total: p.total, pct: p.pct } });
    };
    const onBest = (ev: MessageEvent) => {
      const p = JSON.parse(ev.data);
      set({ optBest: { params: p.best.params, score: p.best.score } });
    };
    const onFinish = () => { /* no-op, API dönüşü set edecek */ };

    es.addEventListener('optimize-start', onStart);
    es.addEventListener('optimize-progress', onProg);
    es.addEventListener('optimize-best', onBest);
    es.addEventListener('optimize-finish', onFinish);
    es.onerror = () => { es.close(); };

    try {
      const b = { ...defaultBase(), ...(base || {}) };
      const s = get().optSettings;
      const chosenRanges =
        (ranges && ranges.length) ? ranges :
        (s.ranges && s.ranges.length ? s.ranges : autoRangesFromParams(get().params));
      const req: OptimizeRequest = {
        base: b,
        ranges: chosenRanges,
        method: s.method,
        maxSamples: s.maxSamples,
        oosPercent: s.oosPercent,
        target: s.target,
        direction: s.direction
      };
      const data = await postJSON(`/api/strategy/optimize?runId=${runId}`, req) as OptimizeResult;
      set({ optResult: data, optRunning: false });
    } catch (e: any) {
      set({ optError: e?.message ?? 'optimize failed', optRunning: false });
    } finally {
      es.close();
    }
  },

  resetOptimize() {
    set({ optRunning: false, optRunId: undefined, optProgress: null, optBest: null, optResult: undefined, optError: undefined });
  }
})); 
