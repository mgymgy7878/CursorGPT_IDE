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
        'px-2 py-1 text-xs rounded border transition-colors',
        variant === 'danger'
          ? 'border-red-700 text-red-300 hover:bg-red-900/20'
          : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800',
        className
      )}
      aria-label={label}
    >
      {icon ?? label}
    </button>
  );
}

