/**
 * MonoNumber - Tabular number display
 *
 * Figma parity: Consistent number width for alignment
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface MonoNumberProps {
  value?: number | string;
  className?: string;
  children?: ReactNode;
}

export function MonoNumber({ value, className, children }: MonoNumberProps) {
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {children ?? value ?? ''}
    </span>
  );
}

