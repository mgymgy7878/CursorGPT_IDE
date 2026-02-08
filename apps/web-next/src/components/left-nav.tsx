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
import { useEffect, useMemo, useState } from 'react'
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
import { NavBadge } from '@/components/ui/NavBadge'
import { useNavIndicators } from '@/hooks/useNavIndicators'

// İkon tipi
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

// Figma'daki menü yapısı - Her item'e accent renk
// North-Star Bilgi Mimarisi: 7 sayfalık trading cockpit
// Sıralama: Optimum frekans mantığıyla (en çok kullanılan üstte)
const baseNavItems: {
  label: string;
  href: string;
  icon: IconComponent;
  accent: string; // Tailwind text-* class
  bgAccent: string; // Tailwind bg-* class for active state
}[] = [
  // 1. Anasayfa (Komuta Paneli) - En sık kullanılan
  { label: 'Anasayfa', href: '/dashboard', icon: IconHome, accent: 'text-sky-400', bgAccent: 'bg-sky-500/10' },
  // 2. Piyasa Verileri - Chart/orderbook workspace
  { label: 'Piyasa Verileri', href: '/market-data', icon: IconBarChart, accent: 'text-emerald-400', bgAccent: 'bg-emerald-500/10' },
  // 3. Çalışan Stratejiler - "Şu an ne çalışıyor?" (canonical: /strategies/running)
  { label: 'Çalışan Stratejiler', href: '/strategies/running', icon: IconPlay, accent: 'text-green-400', bgAccent: 'bg-green-500/10' },
  // 4. Stratejilerim - Strateji envanteri (kütüphane)
  { label: 'Stratejilerim', href: '/strategies', icon: IconFolder, accent: 'text-blue-400', bgAccent: 'bg-blue-500/10' },
  // 5. Strateji Laboratuvarı - Üret/Backtest/Optimize
  { label: 'Strateji Lab', href: '/strategy-lab', icon: IconFlask, accent: 'text-violet-400', bgAccent: 'bg-violet-500/10' },
  // 6. Portföy - Varlıklar + risk bütçesi
  { label: 'Portföy', href: '/portfolio', icon: IconBriefcase, accent: 'text-cyan-400', bgAccent: 'bg-cyan-500/10' },
  // 7. Ayarlar - Bağlantılar + güvenlik
  { label: 'Ayarlar', href: '/settings', icon: IconSettings, accent: 'text-neutral-400', bgAccent: 'bg-neutral-500/10' },
  // Ekstra (opsiyonel, beta/experimental)
  { label: 'Terminal (Beta)', href: '/terminal', icon: IconTestTube, accent: 'text-amber-400', bgAccent: 'bg-amber-500/10' },
]

interface LeftNavProps {
  collapsed?: boolean;
}

export default function LeftNav({ collapsed = false }: LeftNavProps) {
  const pathname = usePathname()
  const indicators = useNavIndicators()
  const [terminalBetaEnabled, setTerminalBetaEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('spark.settings.uiTerminalBeta')
    setTerminalBetaEnabled(stored === '1' || stored === 'true')
  }, [])

  const navItems = useMemo(() => {
    if (terminalBetaEnabled) return baseNavItems
    return baseNavItems.filter((item) => item.href !== '/terminal')
  }, [terminalBetaEnabled])

  const enabledRoutes = useMemo(() => new Set([
    '/dashboard',
    '/market-data',
    '/strategies/running', // Canonical route (eski /running redirect ile çalışır)
    '/strategies',
    '/strategy-lab',
    '/portfolio',
    '/settings',
    '/terminal', // Beta, opsiyonel
  ]), []);

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
          const isEnabled = enabledRoutes.has(item.href)
            const Icon = item.icon
          const badge = indicators.routes[item.href] || null

          const content = (
            <div
              className={cn(
                // Base: rounded-md for pill-like feel
                "rounded-md flex items-center transition-all duration-150 select-none group relative",
                // Collapsed: centered icon, larger hit area
                collapsed
                  ? "justify-center w-10 h-10 mx-auto"
                  : "px-2.5 h-9 gap-2.5",
                // Active / Inactive states with accent colors
                isActive && isEnabled
                  ? cn(item.bgAccent, "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]")
                  :                 isEnabled
                  ? "hover:bg-white/[0.04]"
                  : "opacity-40 cursor-not-allowed"
              )}
              title={item.label}
            >
                {/* Icon with accent color - relative for badge positioning */}
                <div className="relative shrink-0">
                  <Icon
                    size={collapsed ? 20 : 18}
                    strokeWidth={1.8}
                    className={cn(
                      "transition-colors",
                      isActive && isEnabled ? item.accent : "text-white/40 group-hover:text-white/60"
                    )}
                  />
                  {/* PATCH 1: Nav Badge */}
                  {badge && isEnabled && (
                    <NavBadge
                      type={badge.type}
                      variant={badge.variant}
                      value={badge.value}
                    />
                  )}
                </div>
                {/* Label - only in expanded mode */}
                {!collapsed && (
                  <span className={cn(
                    "flex-1 truncate text-[12px] font-medium leading-none transition-colors",
                    isActive && isEnabled ? "text-white" : "text-white/60 group-hover:text-white/80"
                  )}>
                    {item.label}
                    {!isEnabled && <span className="ml-2 text-[10px] text-white/40">Yakında</span>}
              </span>
                )}
            </div>
          )

          return isEnabled ? (
            <Link
              key={item.href}
              href={item.href}
              className="block"
              prefetch={item.href === '/dashboard' || item.href === '/market-data' ? true : undefined}
              // Dashboard ve Market Data için prefetch (kritik sayfalar)
              // Diğerleri için Next.js default (viewport prefetch)
            >
              {content}
            </Link>
          ) : (
            <div key={item.href} className="block">
              {content}
            </div>
          )
        })}
        </div>
      </nav>

      {/* Bottom padding */}
      <div className="h-2 shrink-0" />
    </aside>
  )
}
