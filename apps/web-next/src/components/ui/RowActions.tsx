/**
 * RowActions - Table row action buttons
 *
 * Figma parity: Compact action buttons in table rows
 * PATCH W: Tooltip desteği eklendi
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Tooltip } from './Tooltip';

export interface RowActionsProps {
  children: ReactNode;
  className?: string;
}

export function RowActions({ children, className }: RowActionsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {children}
    </div>
  );
}

// PATCH W.4: RowActions variant for dropdown (vertical layout)
export function RowActionsVertical({ children, className }: RowActionsProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {children}
    </div>
  );
}

export interface RowActionButtonProps {
  onClick?: () => void;
  icon?: ReactNode;
  label?: string;
  variant?: 'default' | 'danger';
  className?: string;
  disabled?: boolean;
}

export function RowActionButton({ onClick, icon, label, variant = 'default', className, disabled = false }: RowActionButtonProps) {
  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // UI-1: Daha ince stroke, daha düşük kontrast (trading-grade)
        'px-1.5 py-0.5 text-[11px] rounded border transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900',
        // PATCH W.4: Dropdown içinde full-width
        '[.flex-col_&]:w-full [.flex-col_&]:justify-start [.flex-col_&]:text-left',
        disabled
          ? 'opacity-50 cursor-not-allowed border-neutral-800/30 text-neutral-500/50'
          : variant === 'danger'
          ? 'border-red-700/50 text-red-400/70 hover:bg-red-900/20 hover:text-red-300 hover:border-red-700'
          : 'border-neutral-700/50 text-neutral-400/70 hover:bg-neutral-800/50 hover:text-neutral-300 hover:border-neutral-600',
        className
      )}
      aria-label={label}
      title={disabled && label ? `${label} (Executor kullanılamıyor)` : label}
    >
      {icon ?? label}
    </button>
  );

  // PATCH W: Tooltip wrapper (label varsa)
  if (label) {
    return (
      <Tooltip content={label} side="top">
        {button}
      </Tooltip>
    );
  }

  return button;
}

