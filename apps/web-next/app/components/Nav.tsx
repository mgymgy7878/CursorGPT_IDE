"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Spark" },
  { href: "/ops", label: "OPS" },
  { href: "/lab", label: "AI Editör" },
  { href: "/strategies", label: "Stratejilerim" },
  { href: "/backtest", label: "Backtest" },
  { href: "/settings", label: "Ayarlar" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, zIndex:50, backdropFilter:"blur(8px)",
      background:"rgba(255,255,255,0.95)", borderBottom:"1px solid #eee",
      boxShadow:"0 1px 3px rgba(0,0,0,0.1)"
    }}>
      <div style={{maxWidth:1200, margin:"0 auto", padding:"10px 16px", display:"flex", gap:12, alignItems:"center"}}>
        {tabs.map(t => {
          const active = pathname === t.href || (t.href !== "/" && pathname?.startsWith(t.href));
          return (
            <Link key={t.href} href={t.href} style={{
              padding:"6px 10px", borderRadius:999, fontWeight:600,
              color: active ? "#065f46" : "#111827",
              background: active ? "#d1fae5" : "transparent", textDecoration:"none"
            }}>{t.label}</Link>
          );
        })}
        <div style={{marginLeft:"auto", fontSize:12, color:"#6b7280"}}>v1.3</div>
      </div>
    </div>
  );
}
