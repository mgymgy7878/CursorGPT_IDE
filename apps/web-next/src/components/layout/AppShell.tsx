/**
 * AppShell - Legacy shell (Settings ve bazı eski sayfalar için)
 *
 * NOT: Ana shell AppFrame.tsx'de. Bu sadece geriye dönük uyumluluk için.
 * HYDRATION: document.cookie okuma mount sonrasına taşındı.
 */
"use client";

import React, { useEffect, useState } from "react";
import { StatusChip } from "./StatusChip";
import { OpsDrawer } from "./OpsDrawer";
import { CommandButton } from "./CommandButton";
import ThemeToggle from "@/components/theme/ThemeToggle";
import navItems from "@/config/nav.json";
import { inferRolesFromCookie } from "@/lib/auth";
import { usePathname } from "next/navigation";

// ⬇️ MUST() KORUMASI - UNDEFINED TESPİT
function must<T>(x: T, name: string): T {
  if (x == null) {
    throw new Error(`[Import Hatası] ${name} = ${String(x)} (muhtemelen yanlış import/export)`);
  }
  return x;
}

// ⬇️ GÜVENLİ BİLEŞENLER - CONSOLE.WARN İLE DOSYA/AD
const SafeStatusChip = must(StatusChip, "StatusChip@AppShell");
const SafeOpsDrawer = must(OpsDrawer, "OpsDrawer@AppShell");
const SafeCommandButton = must(CommandButton, "CommandButton@AppShell");
const SafeThemeToggle = must(ThemeToggle, "ThemeToggle@AppShell");

// ⬇️ İMPORT DEDEKTÖRÜ - DEV-ONLY
if (process.env.NODE_ENV === 'development') {
  console.warn('[Import Check] AppShell bileşenleri yüklendi:', {
    StatusChip: !!StatusChip,
    OpsDrawer: !!OpsDrawer,
    CommandButton: !!CommandButton,
    ThemeToggle: !!ThemeToggle
  });
}

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const pathname = usePathname();

  // HYDRATION FIX: Role'leri mount sonrası oku (SSR'da boş array, CSR'da cookie'den)
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    // Mount sonrası: document.cookie'den token oku ve role'leri çıkar
    const token = document.cookie
      .split('; ')
      .find(c => c.startsWith('spark_session='))
      ?.split('=')[1];
    const inferredRoles = inferRolesFromCookie(token);
    setRoles(inferredRoles as string[]);
  }, []);

  // SSR'da tüm navItems göster, CSR'da role filtreleme uygula
  const filtered = Array.isArray(navItems)
    ? (navItems as any[]).filter((i) => !i.roles || i.roles.some((r: string) => roles.includes(r)))
    : [];

  return (
    <div className="grid min-h-screen grid-cols-[280px_1fr] grid-rows-[56px_1fr] bg-neutral-950 text-neutral-100">
      {/* Sidebar - sabit, scroll yok */}
      <aside className="row-span-2 col-start-1 border-r border-neutral-800 bg-neutral-900 flex flex-col">
        <div className="p-4 flex-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="font-semibold">Spark Trading</span>
          </div>

          <nav className="space-y-1">
            {filtered.map((item: any) => (
              <a
                key={item.path}
                href={item.path}
                className={
                  pathname && (pathname === item.path || pathname.startsWith(item.path + '/'))
                    ? "block px-3 py-2 rounded-lg bg-neutral-800 text-white"
                    : "block px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                }
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Tema seçici - alt */}
        <div className="p-4 border-t border-neutral-800">
          <SafeThemeToggle />
        </div>
      </aside>

      {/* Topbar - tek satır status */}
      <header className="col-start-2 h-14 flex items-center border-b border-neutral-800 bg-neutral-950/60 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/40 z-50">
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2 md:gap-3 text-sm">
            <SafeStatusChip label="Env" value="Mock" />
            <SafeStatusChip label="Feed" value="Healthy" tone="success" />
            <SafeStatusChip label="Broker" value="Offline" tone="warn" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SafeCommandButton />
            <SafeOpsDrawer />
          </div>
        </div>
      </header>

      {/* Content - tek scroll burada */}
      <main className="app-content col-start-2 row-start-2 overflow-y-auto">
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
