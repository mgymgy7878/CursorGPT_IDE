"use client";
import { create } from "zustand";

type LabState = {
  code: string;
  setCode: (v: string) => void;
  appendCode: (v: string) => void;
  clear: () => void;
};

export const useLabStore = create<LabState>((set, get) => ({
  code: "// burada strateji kodu…",
  setCode: (v) => set({ code: v }),
  appendCode: (v) => set({ code: get().code ? `${get().code}\n${v}` : v }),
  clear: () => set({ code: "" }),
}));


