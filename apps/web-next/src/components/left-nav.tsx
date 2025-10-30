"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Home,
  TrendingUp,
  FlaskConical,
  FolderKanban,
  Activity,
  Wallet,
  Bell,
  FileSearch,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DensityToggle from "@/components/layout/DensityToggle";

type Route = {
  key: string;
  path: string;
  icon: any;
  group: "primary" | "secondary";
};

const ROUTES: Route[] = [
  // PRIMARY
  { key: "dashboard", path: "/dashboard", icon: Home, group: "primary" },
  { key: "market", path: "/market", icon: TrendingUp, group: "primary" },
  { key: "strategyLab", path: "/strategy-lab", icon: FlaskConical, group: "primary" },
  { key: "strategies", path: "/strategies", icon: FolderKanban, group: "primary" },
  { key: "running", path: "/running", icon: Activity, group: "primary" },
  // SECONDARY
  { key: "portfolio", path: "/portfolio", icon: Wallet, group: "secondary" },
  { key: "alerts", path: "/alerts", icon: Bell, group: "secondary" },
  { key: "audit", path: "/audit", icon: FileSearch, group: "secondary" },
  { key: "guardrails", path: "/guardrails", icon: ShieldCheck, group: "secondary" },
  { key: "settings", path: "/settings", icon: Settings, group: "secondary" },
];

export default function LeftNav() {
  const pathname = usePathname();
  const t = useTranslation("common");
  const [collapsed, setCollapsed] = useState(false);

  const NavItem = ({ route }: { route: Route }) => {
    const isActive = pathname === route.path || pathname?.startsWith(route.path + "/");
    const Icon = route.icon;

    return (
      <Link
        href={route.path}
        aria-current={isActive ? "page" : undefined}
        title={collapsed ? t(route.key) : undefined}
        className={`
          flex items-center gap-3 rounded-lg px-3
          h-10
          text-sm transition-colors
          ${isActive
            ? "bg-blue-600 text-white"
            : "hover:bg-zinc-800 text-neutral-300"
          }
        `}
      >
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        {!collapsed && <span className="truncate leading-none">{t(route.key)}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-[224px]"
      } border-r border-zinc-800 h-full p-3 transition-[width] duration-200`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? t("expand") : t("collapse")}
        className="w-full flex items-center justify-center px-3 h-10 mb-3 rounded-lg hover:bg-zinc-800 text-neutral-400 transition-colors"
      >
        {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
      </button>

      {/* Primary Navigation */}
      <nav className="space-y-1 mb-4">
        {ROUTES.filter((r) => r.group === "primary").map((route) => (
          <NavItem key={route.path} route={route} />
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-zinc-800 my-3" />

      {/* Secondary Navigation */}
      <nav className="space-y-1">
        {ROUTES.filter((r) => r.group === "secondary").map((route) => (
          <NavItem key={route.path} route={route} />
        ))}
      </nav>

      {/* Density Toggle */}
      <div className="mt-auto pt-3 border-t border-zinc-800">
        <DensityToggle />
      </div>
    </aside>
  );
}
