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

type State = {
  runId?: string;
  running: boolean;
  progress: { done: number; total: number; pct: number } | null;
  result?: OptimizeResult;
  error?: string;
  start: (req: OptimizeRequest) => Promise<void>;
  reset: () => void;
};

export const useOptimizeStore = create<State>((set) => ({
  running: false, progress: null,
  async start(req) {
    set({ running: true, error: undefined, result: undefined, progress: { done:0, total:0, pct:0 } });
    const runId = Math.random().toString(36).slice(2);
    set({ runId });
    try {
      const data = await postJSON(`/api/strategy/optimize?runId=${runId}`, req) as OptimizeResult;
      set({ result: data, running: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'optimize failed', running: false });
    }
  },
  reset() { set({ runId: undefined, running: false, progress: null, result: undefined, error: undefined }); }
})); 
