/**
 * LeftNav - Figma Parity v5 (ActivityBar + LeftNavPanel Style)
 *
 * Figma'daki 2 katmanlı sol navigasyona yaklaş:
 * - Collapsed: ActivityBar tarzı (icon-only, accent renkler)
 * - Expanded: LeftNavPanel (icon + label + accent bg)
 * - Her item'e Figma'daki gibi accent renk
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  IconHome,
  IconBarChart,
  IconFlask,
  IconFolder,
  IconPlay,
  IconBriefcase,
  IconBell,
  IconClipboard,
  IconLock,
  IconTestTube,
  IconSettings,
  IconHistory,
} from '@/components/ui/LocalIcons'
import type { ComponentType, SVGProps } from 'react'

// İkon tipi
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

// Figma'daki menü yapısı - Her item'e accent renk
// PATCH: Sadeleştirilmiş menü (≤ 10 item)
const navItems: {
  label: string;
  href: string;
  icon: IconComponent;
  accent: string; // Tailwind text-* class
  bgAccent: string; // Tailwind bg-* class for active state
}[] = [
  { label: 'Ana Sayfa', href: '/dashboard', icon: IconHome, accent: 'text-sky-400', bgAccent: 'bg-sky-500/10' },
  { label: 'Piyasa Verileri', href: '/market-data', icon: IconBarChart, accent: 'text-emerald-400', bgAccent: 'bg-emerald-500/10' },
  { label: 'Stratejilerim', href: '/strategies', icon: IconFolder, accent: 'text-blue-400', bgAccent: 'bg-blue-500/10' },
  { label: 'Çalışan Stratejiler', href: '/running', icon: IconPlay, accent: 'text-green-400', bgAccent: 'bg-green-500/10' },
  { label: 'Operasyon Merkezi', href: '/control', icon: IconLock, accent: 'text-orange-400', bgAccent: 'bg-orange-500/10' },
  { label: 'Ayarlar', href: '/settings', icon: IconSettings, accent: 'text-neutral-400', bgAccent: 'bg-neutral-500/10' },
]

interface LeftNavProps {
  collapsed?: boolean;
}

export default function LeftNav({ collapsed = false }: LeftNavProps) {
  const pathname = usePathname()

  return (
    <aside className="h-full shrink-0 bg-neutral-950 flex flex-col border-r border-white/6">
      {/* Navigation Items - Figma ActivityBar + LeftNavPanel style */}
      <nav className={cn(
        "flex-1 overflow-y-auto py-2",
        collapsed ? "px-1" : "px-2"
      )}>
        <div className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
                className={cn(
                  // Base: rounded-md for pill-like feel
                  "rounded-md flex items-center transition-all duration-150 select-none group",
                  // Collapsed: centered icon, larger hit area
                  collapsed
                    ? "justify-center w-10 h-10 mx-auto"
                    : "px-2.5 h-9 gap-2.5",
                  // Active / Inactive states with accent colors
                  isActive
                    ? cn(item.bgAccent, "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]")
                    : "hover:bg-white/[0.04]"
                )}
                title={item.label}
              >
                {/* Icon with accent color */}
                <Icon
                  size={collapsed ? 20 : 18}
                  strokeWidth={1.8}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? item.accent : "text-white/40 group-hover:text-white/60"
                  )}
                />
                {/* Label - only in expanded mode */}
                {!collapsed && (
                  <span className={cn(
                    "flex-1 truncate text-[12px] font-medium leading-none transition-colors",
                    isActive ? "text-white" : "text-white/60 group-hover:text-white/80"
                  )}>
                    {item.label}
              </span>
                )}
            </Link>
          )
        })}
        </div>
      </nav>

      {/* Bottom padding */}
      <div className="h-2 shrink-0" />
    </aside>
  )
}
