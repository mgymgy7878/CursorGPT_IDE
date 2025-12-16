/**
 * LeftNav - Figma Parity v0
 *
 * Figma'daki shell görünümüne yaklaş:
 * - İkonlu menü
 * - Aktif item highlight
 * - Collapse handle (şimdilik sadece UI)
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Figma'daki menü yapısı
const navItems = [
  { label: 'Ana Sayfa', href: '/dashboard', icon: '🏠' },
  { label: 'Piyasa Verileri', href: '/market-data', icon: '📊' },
  { label: 'Strateji Laboratuvarı', href: '/strategy-lab', icon: '🧪' },
  { label: 'Stratejilerim', href: '/strategies', icon: '📁' },
  { label: 'Çalışan Stratejiler', href: '/running', icon: '▶️' },
  { label: 'Portföy', href: '/portfolio', icon: '💼' },
  { label: 'Uyarılar', href: '/alerts', icon: '🔔' },
  { label: 'Denetim / Loglar', href: '/audit', icon: '📋' },
  { label: 'Risk / Koruma', href: '/guardrails', icon: '🔒' },
  { label: 'UX Test Runner', href: '/canary', icon: '🧪' },
  { label: 'Ayarlar', href: '/settings', icon: '⚙️' },
  { label: 'Karar Geçmişi', href: '/audit', icon: '📜' },
] as const

export default function LeftNav() {
  const pathname = usePathname()

  return (
    <aside className="w-[280px] shrink-0 border-r border-neutral-800 bg-neutral-950/50 flex flex-col h-full">
      {/* Logo/Brand (üst) */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <span className="text-sm font-semibold text-neutral-200">Spark Trading</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Collapse Handle (alt) */}
      <div className="px-4 py-2 border-t border-neutral-800">
        <button
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-neutral-800/50 transition-colors"
          aria-label="Menüyü daralt"
          title="Menüyü daralt (şimdilik sadece UI)"
        >
          <span className="text-neutral-400 text-xs">◀</span>
        </button>
      </div>
    </aside>
  )
}
