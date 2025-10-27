"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import CommandPalette from "@/components/shell/CommandPalette";
import AIChatDock from "@/components/ai/AIChatDock";
import { useExchange } from "@/contexts/ExchangeContext";

const NAV = [
  { href: "/dashboard", label: "Anasayfa" },
  { href: "/orders", label: "Orders" },
  { href: "/positions", label: "Positions" },
  { href: "/strategy-lab", label: "Strategy Lab" },
  { href: "/backtest", label: "Backtest" },
  { href: "/canary", label: "Canary" },
  { href: "/ai", label: "AI" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { exchange, setExchange } = useExchange();
  const btcturkEnabled = process.env.NEXT_PUBLIC_BTCTURK_ENABLED === 'true';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex">
      {/* Left Nav */}
      <aside className="hidden md:flex w-52 shrink-0 border-r border-zinc-800 flex-col">
        <div className="h-12 px-3 flex items-center gap-2 border-b border-zinc-800">
          <div className="h-6 w-6 rounded bg-emerald-500" aria-hidden />
          <span className="font-semibold text-sm">Spark Trading</span>
        </div>
        <nav className="p-2 space-y-1 text-sm">
          {NAV.map(i => {
            const active = pathname?.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href}
                className={`block px-3 py-2 rounded border ${active
                  ? 'border-emerald-600 text-emerald-300 bg-emerald-900/10'
                  : 'border-transparent hover:border-zinc-700 hover:bg-zinc-900'}`
                }>
                {i.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-12 border-b border-zinc-800 flex items-center px-2 gap-2">
          <button
            className="md:hidden px-2 py-1 rounded border border-zinc-700"
            onClick={() => alert('Mobile drawer TODO (mevcut Drawer ile bağlanır)')}
            aria-label="Open navigation">☰</button>
          <div className="text-xs text-zinc-400 hidden md:block">EX:</div>
          <div className="flex items-center gap-1">
            {['auto','binance','btcturk'].map(x => (
              <button key={x}
                onClick={()=>setExchange?.(x as any)}
                className={`px-2 py-0.5 rounded border text-xs ${exchange===x
                  ? (x==='btcturk' ? 'border-sky-600 text-sky-300' : 'border-amber-600 text-amber-300')
                  : 'border-zinc-700 text-zinc-400 hover:bg-zinc-900'}`}>
                {x==='auto' ? 'Auto' : x.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!btcturkEnabled && (
              <span className="px-2 py-0.5 rounded border border-zinc-700 text-xs text-zinc-300" title="Development mode: BTCTurk disabled">
                BTCTurk: offline
              </span>
            )}
            <CommandPalette />
            <Link href="/ai" className="px-2 py-1 rounded border border-zinc-700 text-sm hover:bg-zinc-900"
              title="AI asistan tam sayfa">🤖 AI</Link>
          </div>
        </header>
        {/* Content */}
        <main className="p-2">{children}</main>
      </div>

      {/* AI Dock */}
      <AIChatDock />
    </div>
  );
} 