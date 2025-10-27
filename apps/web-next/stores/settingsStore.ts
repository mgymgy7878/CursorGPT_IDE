"use client";
import { create } from "zustand";

type Settings = {
  theme: "dark"|"light";
  locale: "tr"|"en";
  wsUrl?: string;
};
type State = Settings & {
  setTheme: (t: Settings["theme"]) => void;
  setLocale: (l: Settings["locale"]) => void;
  setWsUrl: (u: string) => void;
  load: () => void;
};
export const useSettings = create<State>((set,get)=>({
  theme: "dark", locale: "tr", wsUrl: process.env.NEXT_PUBLIC_EXECUTOR_WS_URL,
  setTheme: (t) => { set({theme:t}); localStorage.setItem("settings.theme", t); },
  setLocale:(l)=> { set({locale:l}); localStorage.setItem("settings.locale", l); },
  setWsUrl:(u)=> { set({wsUrl:u});   localStorage.setItem("settings.wsUrl", u); },
  load: () => set({
    theme:  (localStorage.getItem("settings.theme")  as any) ?? "dark",
    locale: (localStorage.getItem("settings.locale") as any) ?? "tr",
    wsUrl:   localStorage.getItem("settings.wsUrl") ?? process.env.NEXT_PUBLIC_EXECUTOR_WS_URL
  })
}));


