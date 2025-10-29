"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";

// PRIMARY navigation items only
// SECONDARY pages (market-data, alerts, audit, observability) can be toggled in settings
const navItems = [
  { key: "dashboard", href: "/dashboard" },
  { key: "strategyLab", href: "/strategy-lab" },
  { key: "strategies", href: "/strategies" },
  { key: "running", href: "/running" },
  { key: "settings", href: "/settings" },
] as const;

export default function LeftNav() {
  const pathname = usePathname();
  const t = useTranslation("common");

  return (
    <aside className="w-[72px] md:w-[224px] border-r h-full p-3 space-y-1 transition-[width] duration-200">
      {navItems.map(({ key, href }) => {
        const isActive = pathname === href || pathname?.startsWith(href + "/");

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "hover:bg-zinc-900 text-neutral-300"
            }`}
          >
            {t(key)}
          </Link>
        );
      })}
    </aside>
  );
}
