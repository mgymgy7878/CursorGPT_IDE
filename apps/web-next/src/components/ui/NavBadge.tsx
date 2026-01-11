/**
 * NavBadge - Terminal-style navigation indicator
 *
 * Displays dot (health), number (count), or pulse (critical) on nav items
 */

'use client';

import { cn } from '@/lib/utils';

export type BadgeType = 'dot' | 'number' | 'pulse';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface NavBadgeProps {
  type: BadgeType;
  variant?: BadgeVariant;
  value?: number | string;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { dot: string; number: string; pulse: string }> = {
  success: {
    dot: 'bg-emerald-500',
    number: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    pulse: 'bg-emerald-500 animate-pulse',
  },
  warning: {
    dot: 'bg-amber-500',
    number: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    pulse: 'bg-amber-500 animate-pulse',
  },
  danger: {
    dot: 'bg-red-500',
    number: 'bg-red-500/20 text-red-400 border-red-500/40',
    pulse: 'bg-red-500 animate-pulse',
  },
  info: {
    dot: 'bg-blue-500',
    number: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    pulse: 'bg-blue-500 animate-pulse',
  },
  neutral: {
    dot: 'bg-neutral-500',
    number: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/40',
    pulse: 'bg-neutral-500 animate-pulse',
  },
};

export function NavBadge({ type, variant = 'info', value, className }: NavBadgeProps) {
  if (type === 'dot') {
    return (
      <span
        className={cn(
          'absolute top-0 right-0 w-1.5 h-1.5 rounded-full',
          variantStyles[variant].dot,
          className
        )}
        aria-label={`Status: ${variant}`}
      />
    );
  }

  if (type === 'number') {
    const displayValue = typeof value === 'number' && value > 99 ? '99+' : value;
    if (!displayValue || (typeof displayValue === 'number' && displayValue === 0)) {
      return null;
    }

    return (
      <span
        className={cn(
          'absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold',
          'flex items-center justify-center border',
          variantStyles[variant].number,
          className
        )}
        aria-label={`Count: ${displayValue}`}
      >
        {displayValue}
      </span>
    );
  }

  if (type === 'pulse') {
    return (
      <span
        className={cn(
          'absolute top-0 right-0 w-1.5 h-1.5 rounded-full',
          variantStyles[variant].pulse,
          className
        )}
        aria-label="Critical status"
      />
    );
  }

  return null;
}

