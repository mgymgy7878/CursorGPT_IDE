/**
 * SkeletonBlock - Deterministic loading skeleton
 *
 * Figma parity: Consistent skeleton blocks for visual regression
 */

import { Skeleton } from './states/Skeleton';
import { cn } from '@/lib/utils';

export interface SkeletonBlockProps {
  variant?: 'card' | 'table' | 'form' | 'list';
  className?: string;
}

export function SkeletonBlock({ variant = 'card', className }: SkeletonBlockProps) {
  const variants = {
    card: (
      <div className="space-y-3">
        <Skeleton height={20} width="60%" />
        <Skeleton height={16} width="80%" />
        <Skeleton height={16} width="40%" />
      </div>
    ),
    table: (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={40} width="100%" />
        ))}
      </div>
    ),
    form: (
      <div className="space-y-4">
        <Skeleton height={40} width="100%" />
        <Skeleton height={40} width="100%" />
        <Skeleton height={120} width="100%" />
        <Skeleton height={40} width="30%" />
      </div>
    ),
    list: (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton height={16} width="60%" />
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className={cn('p-4', className)}>
      {variants[variant]}
    </div>
  );
}

