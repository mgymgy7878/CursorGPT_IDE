"use client";
import { create } from "zustand";
import { execStart, execPause, execStop, execList } from "@/lib/api/executor";

type Row = { id:string; name:string; status:"running"|"paused"|"stopped"; pl:number };
type State = { rows: Row[]; upsert:(r:Row)=>void; refresh:()=>Promise<void>;
  start:(id:string,name?:string)=>Promise<void>; pause:(id:string)=>Promise<void>; stop:(id:string)=>Promise<void>; };
export const useActiveStrategies = create<State>((set,get)=>({
  rows: [],
  upsert: (r) => set(s=>{
    const i = s.rows.findIndex(x=>x.id===r.id);
    const rows = [...s.rows]; if(i>=0) rows[i]=r; else rows.push(r); return { rows };
  }),
  refresh: async () => {
    const data = await execList(); const rows = data?.rows ?? [];
    set({ rows });
  },
  start: async (id,name) => { await execStart(id,name); await get().refresh(); },
  pause: async (id)     => { await execPause(id);       await get().refresh(); },
  stop:  async (id)     => { await execStop(id);        await get().refresh(); },
}));


