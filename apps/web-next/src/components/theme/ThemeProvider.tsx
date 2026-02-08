"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "auto"; // auto = gün ışığına göre
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light"|"dark" };
const ThemeCtx = createContext<Ctx | null>(null);

function resolveAuto(): "light"|"dark" {
  // Gün ışığına göre: 07:00–19:00 = light, aksi = dark
  const hour = new Date().getHours();
  const daylight = hour >= 7 && hour < 19;
  return daylight ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "auto";
    return (localStorage.getItem("theme") as Theme) || "auto";
  });
  const resolved = useMemo(() => (theme === "auto" ? resolveAuto() : theme), [theme]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", resolved);
    }
  }, [resolved]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
      if (theme === "auto") {
        const iv = setInterval(() => {
          document.documentElement.setAttribute("data-theme", resolveAuto());
        }, 60 * 60 * 1000); // saat başı kontrol
        return () => clearInterval(iv);
      }
    }
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>;
}
export function useTheme(){ const c = useContext(ThemeCtx); if(!c) throw new Error("ThemeProvider yok"); return c; }


