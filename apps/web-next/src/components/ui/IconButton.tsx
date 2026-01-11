/**
 * IconButton - PATCH W
 *
 * Icon-only button wrapper with mandatory tooltip and aria-label.
 * Dev mode'da eksik title/aria-label için console.warn.
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip } from './Tooltip';

export interface IconButtonProps {
  icon: ReactNode;
  label: string; // Zorunlu: tooltip ve aria-label için
  onClick?: () => void;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'soft';
  disabled?: boolean;
  className?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  'aria-label'?: string; // Optional override
}

export function IconButton({
  icon,
  label,
  onClick,
  size = 'md',
  variant = 'ghost',
  disabled = false,
  className,
  tooltipSide = 'top',
  'aria-label': ariaLabelOverride,
}: IconButtonProps) {
  // Dev mode'da label kontrolü
  if (process.env.NODE_ENV === 'development' && !label) {
    console.warn('[IconButton] label prop is required for accessibility');
  }

  const ariaLabel = ariaLabelOverride || label;

  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center rounded transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900',
        size === 'sm' && 'w-6 h-6',
        size === 'md' && 'w-8 h-8',
        variant === 'ghost' && 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5',
        variant === 'soft' && 'text-neutral-300 bg-white/5 hover:bg-white/10',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon}
    </button>
  );

  // Tooltip wrapper (sadece label varsa)
  if (label) {
    return (
      <Tooltip content={label} side={tooltipSide}>
        {button}
      </Tooltip>
    );
  }

  return button;
}

