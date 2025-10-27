import React, { useEffect, useState } from "react";

export default function ThemeToggle(){
  const [theme,setTheme] = useState<'light'|'dark'>(() =>
    (typeof window!=='undefined' && (localStorage.getItem('theme') as any)) || 'light'
  );
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    localStorage.setItem('theme', theme);
  },[theme]);
  return (
    <button className="btn ghost" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} title="Tema">
      {theme==='dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
} 
