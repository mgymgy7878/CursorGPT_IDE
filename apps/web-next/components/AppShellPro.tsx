"use client";
import { ReactNode } from "react";
import { BuilderBanner } from "./BuilderBanner";
import { usePathname } from "next/navigation";

const links = [
  { href: '/dashboard', label: 'Anasayfa' },
  { href: '/control-center', label: 'Control Center' },
  { href: '/strategy-lab', label: 'Strategy Lab' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
];

function Nav() {
  const pathname = usePathname() || '';
  return (
    <nav className="flex gap-2 text-sm">
      {links.map(l => {
        const active = pathname === l.href;
        return (
          <a key={l.href}
             href={l.href}
             className={`px-3 py-1.5 rounded-lg border ${active ? 'border-zinc-600 bg-zinc-900' : 'border-transparent hover:border-zinc-700'}`}>
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}

export default function AppShellPro({ children }: { children: ReactNode }) {
  return (
    <>
      <BuilderBanner />
      <header className="sticky top-0 z-40 border-b border-zinc-800 backdrop-blur bg-zinc-950/70">
        <div className="container-xxl h-14 flex items-center justify-between">
          <div className="font-semibold tracking-wide">⚡ Spark Trading</div>
          <Nav />
        </div>
      </header>

      <main className="container-xxl py-6">
        {children}
      </main>
    </>
  );
} 