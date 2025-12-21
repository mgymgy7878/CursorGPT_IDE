/**
 * UI Tokens - Single Source of Truth
 *
 * Tek yerden yönetilen className preset'leri.
 * Figma micro-parity yerine P0/P1 stabiliteye odaklanıyoruz.
 *
 * KURAL: Bu dosyadan export edilen token'lar kullanılmalı.
 * Hard-coded Tailwind class'lar yerine token import et.
 */

import { cn } from '@/lib/utils';

// ============================================================================
// Typography Tokens
// ============================================================================

/** Card/Section başlığı */
export const cardHeader = 'text-[13px] font-medium text-neutral-200 leading-none';

/** Body text (standart) */
export const bodyText = 'text-[13px] font-medium leading-none';

/** Label (subtle, küçük) */
export const label = 'text-[11px] font-medium leading-none text-white/60';

/** Value (büyük sayılar) */
export const value = 'text-[20px] font-semibold leading-none text-white tabular-nums';

/** Subtle text (alt satır, açıklama) */
export const subtleText = 'text-[11px] font-medium leading-none text-white/50 tabular-nums';

/** Delta text (yüzde değişim) */
export const deltaText = 'text-[11px] font-medium leading-none tabular-nums';

// ============================================================================
// Component Tokens
// ============================================================================

/** Badge (status pill) */
export const badge = 'h-6 px-2 flex items-center text-[11px] font-medium rounded-full leading-none';

/** Pill button (quick action) */
export const pillButton = 'h-8 px-3 rounded-full text-[12px] font-medium whitespace-nowrap leading-none';

/** Nav item base */
export const navItemBase = 'h-10 px-3 rounded-xl flex items-center gap-3 transition-colors select-none';

/** Nav item inactive */
export const navItemInactive = 'text-white/70 hover:bg-white/[0.04] hover:text-white';

/** Nav item active */
export const navItemActive = 'bg-white/[0.05] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]';

// ============================================================================
// Surface Tokens
// ============================================================================

/** Mini-stat card (Portfolio Summary içi) */
export const miniStatCard = 'min-w-0 overflow-hidden rounded-xl bg-white/[0.02] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]';

/** Divider (border) */
export const divider = 'border-white/8';

/** Divider (vertical) */
export const dividerVertical = 'border-r border-white/8';

/** Divider (horizontal) */
export const dividerHorizontal = 'border-b border-white/8';

// ============================================================================
// Layout Tokens
// ============================================================================

/** Card padding */
export const cardPadding = 'p-4';

/** Card gap */
export const cardGap = 'gap-5';

/** Section spacing */
export const sectionSpacing = 'space-y-1';

// ============================================================================
// Helper Functions
// ============================================================================

/** Badge variant helper */
export function badgeVariant(variant: 'default' | 'success' | 'warning' | 'error' | 'info') {
  const variants = {
    default: 'bg-neutral-800/80 border border-white/8 text-neutral-300',
    success: 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/20 border border-amber-500/30 text-amber-300',
    error: 'bg-red-500/20 border border-red-500/30 text-red-300',
    info: 'bg-blue-500/20 border border-blue-500/30 text-blue-300',
  };
  return cn(badge, variants[variant]);
}

/** Pill button variant helper */
export function pillButtonVariant(variant: 'default' | 'primary' | 'subtle') {
  const variants = {
    default: 'bg-white/5 hover:bg-white/8 border border-white/10 text-white/80',
    primary: 'bg-sky-500/12 hover:bg-sky-500/16 text-sky-300/90 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.16)]',
    subtle: 'bg-white/[0.02] hover:bg-white/[0.04] text-white/70',
  };
  return cn(pillButton, variants[variant]);
}

