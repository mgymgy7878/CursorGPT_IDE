"use client";
import { create } from "zustand";

type Spec = { code: string; params: Record<string, any>; metrics?: { totalReturn:number; maxDD:number; winRate:number; sharpe:number } };

type State = {
  draftId?: string;
  publishing: boolean;
  publishDraft: (spec: Spec) => Promise<string>;
};

export const useStrategyLabStore = create<State>((set) => ({
  publishing: false,
  async publishDraft(spec: Spec) {
    set({ publishing: true });
    try {
      const r = await fetch("/api/lab/publish", { method:"POST", headers:{"content-type":"application/json","X-Spark-Actor":"ui","X-Spark-Source":"strategy-lab","X-Spark-Intent":"publish-draft"}, body: JSON.stringify(spec), cache:"no-store" as any });
      const j = await r.json().catch(()=>({ ok:false, draftId:'' }));
      set({ draftId: j.draftId, publishing: false });
      return j.draftId;
    } finally {
      set({ publishing: false });
    }
  },
}));

