"use client";
import { useTheme } from "./ThemeProvider";
export default function ThemeToggle(){
  const { theme, setTheme, resolved } = useTheme();
  return (
    <div className="fixed bottom-4 left-4 z-40 card p-2 flex items-center gap-2">
      <span className="muted text-xs">Tema:</span>
      <select className="inp" value={theme} onChange={e=>setTheme(e.target.value as any)}>
        <option value="light">Aydınlık</option>
        <option value="dark">Karanlık</option>
        <option value="auto">Gün ışığı (Auto)</option>
      </select>
      <span className="muted text-xs">({resolved})</span>
    </div>
  );
}


