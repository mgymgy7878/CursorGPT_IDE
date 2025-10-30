"use client";
/**
 * @deprecated Shell is deprecated. Use the root layout (app/layout.tsx) with LeftNav instead.
 * This component creates a duplicate sidebar when used with the new layout system.
 *
 * Migration: Remove Shell wrapper from pages - content will render directly in the root layout.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import CommandPalette from "@/components/ui/CommandPalette";
import { useTranslation } from "@/i18n/useTranslation";

const AlarmCard = dynamic(() => import("@/components/dashboard/AlarmCard"), {
  ssr: false,
});
const SmokeCard = dynamic(() => import("@/components/dashboard/SmokeCard"), {
  ssr: false,
});

const ROUTES = [
  { key: "dashboard", path: "/dashboard" },
  { key: "market", path: "/market" },
  { key: "running", path: "/running" },
  { key: "portfolio", path: "/portfolio" },
  { key: "settings", path: "/settings" },
] as const;

type RouteItem = (typeof ROUTES)[number];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslation("common");
  const NavItem = ({ href, label }: { href: string; label: string }) => {
    const active = pathname?.startsWith(href) ?? false;
    return (
      <Link
        href={href as any}
        className={`block px-3 py-2 rounded-xl transition ${active ? "bg-neutral-800 font-semibold" : "hover:bg-neutral-800/50"}`}
      >
        {label}
      </Link>
    );
  };
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center gap-3">
          <Link href="/" className="font-bold">
            SPARK
          </Link>
          <div className="flex-1" />
          <input
            aria-label="Global Search"
            placeholder="Ara…"
            className="hidden md:block px-3 py-1.5 rounded-lg border border-neutral-800 bg-black w-72"
          />
          <CommandPalette />
          <div
            aria-label="Profile"
            className="w-8 h-8 rounded-full bg-neutral-800"
          />
        </div>
      </header>
      <div className="mx-auto max-w-[1400px] px-4 py-4 grid grid-cols-1 md:grid-cols-[240px_1fr_360px] gap-4">
        <aside className="md:sticky md:top-16 h-max border border-neutral-800 rounded-2xl p-3">
          <nav className="space-y-1">
            {ROUTES.map((route) => (
              <NavItem key={route.key} href={route.path} label={t(route.key)} />
            ))}
          </nav>
        </aside>
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <aside className="md:sticky md:top-16 h-max space-y-3">
          <div className="border border-neutral-800 rounded-2xl p-3">
            <AlarmCard />
          </div>
          <div className="border border-neutral-800 rounded-2xl p-3">
            <SmokeCard />
          </div>
        </aside>
      </div>
      <a href="#main" className="sr-only focus:not-sr-only">
        İçeriğe atla
      </a>
    </div>
  );
}
