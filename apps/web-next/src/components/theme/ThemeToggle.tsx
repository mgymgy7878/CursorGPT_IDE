/**
 * ThemeToggle - Hydration-safe theme selector
 *
 * resolved değeri sadece mount olduktan sonra gösterilir (SSR/CSR uyumu).
 */
"use client";

import { useTheme } from "./ThemeProvider";
import { useHydrated } from "@/hooks/useHydrated";

export default function ThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();
  const hydrated = useHydrated();

  return (
    <div className="fixed bottom-4 left-4 z-40 card p-2 flex items-center gap-2">
      <span className="muted text-xs whitespace-nowrap">Tema:</span>
      <select
        className="inp"
        value={theme}
        onChange={e => setTheme(e.target.value as "light" | "dark" | "auto")}
      >
        <option value="light">Aydınlık</option>
        <option value="dark">Karanlık</option>
        <option value="auto">Gün ışığı (Auto)</option>
      </select>
      {/* resolved değeri sadece hydrate olduktan sonra göster - SSR/CSR uyumu */}
      {hydrated && (
        <span className="muted text-xs whitespace-nowrap">({resolved})</span>
      )}
    </div>
  );
}
