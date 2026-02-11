/**
 * Surface - Figma Parity Design Primitive
 *
 * Variants: panel, card, inset
 * Token-based styling (tokens.css)
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface SurfaceProps {
  variant?: 'panel' | 'card' | 'inset';
  children: ReactNode;
  className?: string;
}

export function Surface({ variant = 'card', children, className }: SurfaceProps) {
  // Figma parity: soft border (inset shadow yerine border), radius ~16px (rounded-2xl)
  // Border yerine inset shadow daha soft ama Surface için border tutuyoruz (kart dış çerçevesi)
  const baseClasses = 'border border-white/8 rounded-2xl';

  const variantClasses = {
    panel: 'bg-neutral-900/60 backdrop-blur-sm',
    card: 'bg-neutral-900/80',
    inset: 'bg-neutral-950/50 border-white/8',
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  );
}

export function SurfaceHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-3 border-b border-neutral-800', className)}>
      {children}
    </div>
  );
}

export function SurfaceContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('p-4', className)}>
      {children}
    </div>
  );
}

