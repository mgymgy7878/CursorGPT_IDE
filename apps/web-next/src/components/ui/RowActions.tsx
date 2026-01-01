/**
 * RowActions - Table row action buttons
 *
 * Figma parity: Compact action buttons in table rows
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

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

export interface RowActionButtonProps {
  onClick?: () => void;
  icon?: ReactNode;
  label?: string;
  variant?: 'default' | 'danger';
  className?: string;
}

export function RowActionButton({ onClick, icon, label, variant = 'default', className }: RowActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // UI-1: Daha ince stroke, daha düşük kontrast (trading-grade)
        'px-1.5 py-0.5 text-[11px] rounded border transition-colors',
        variant === 'danger'
          ? 'border-red-700/50 text-red-400/70 hover:bg-red-900/20 hover:text-red-300 hover:border-red-700'
          : 'border-neutral-700/50 text-neutral-400/70 hover:bg-neutral-800/50 hover:text-neutral-300 hover:border-neutral-600',
        className
      )}
      aria-label={label}
    >
      {icon ?? label}
    </button>
  );
}

