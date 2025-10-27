"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "📊 Dashboard", category: "Ana" },
  { href: "/portfolio", label: "💼 Portföy", category: "Ana" },
  { href: "/copilot-home", label: "🤖 Copilot Home", category: "Ana" },
  { href: "/correlation", label: "🔗 Korelasyon", category: "Analiz" },
  { href: "/signals", label: "📡 Sinyal Merkezi", category: "Analiz" },
  { href: "/macro", label: "📅 Makro Takvim", category: "Analiz" },
  { href: "/news", label: "📰 Haber / KAP", category: "Analiz" },
  { href: "/strategy-lab-copilot", label: "🧪 Strateji Lab", category: "Strateji" },
  { href: "/backtest-lab", label: "📊 Backtest Lab", category: "Strateji" },
  { href: "/strategies", label: "📋 Stratejiler", category: "Strateji" },
  { href: "/strategies/running", label: "▶️ Çalışanlar", category: "Strateji" },
  { href: "/settings", label: "⚙️ Ayarlar", category: "Sistem" },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  // Group links by category
  const categories = Array.from(new Set(links.map(l => l.category)));
  
  return (
    <aside className="w-64 border-r bg-white flex flex-col">
      <div className="p-4 border-b">
        <div className="text-lg font-bold">⚡ Spark Platform</div>
        <div className="text-xs text-gray-500">Trading & Analytics</div>
      </div>
      <nav className="p-3 space-y-3 overflow-y-auto flex-1">
        {categories.map(category => (
          <div key={category}>
            <div className="text-[10px] uppercase text-gray-500 mb-2 px-2">{category}</div>
            <div className="space-y-1">
              {links.filter(l => l.category === category).map((l) => {
                const active = pathname === l.href || pathname?.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`block rounded-lg px-3 py-2 text-sm transition
                      ${active ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t">
        <div className="rounded-lg bg-green-50 border border-green-200 p-2">
          <div className="text-[10px] text-green-700 mb-1">Sistem Durumu</div>
          <div className="text-xs text-green-600 flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Çalışıyor
          </div>
        </div>
      </div>
      <div className="p-3 border-t text-xs text-gray-500">
        v1.0 • © {new Date().getFullYear()} Spark
      </div>
    </aside>
  );
}
