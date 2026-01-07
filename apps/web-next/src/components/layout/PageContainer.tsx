/**
 * PageContainer - PATCH W.2 (P0)
 *
 * Sayfa içerik wrapper'ı. Wide layout desteği ile table-heavy sayfalar için geniş alan sağlar.
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  children: ReactNode;
  /** Container genişliği */
  size?: 'default' | 'wide' | 'full';
  className?: string;
}

export function PageContainer({ children, size = 'default', className }: PageContainerProps) {
  const sizeClasses = {
    default: 'w-full max-w-[1200px] mx-auto px-6',
    wide: 'w-full max-w-[1600px] mx-auto px-6',
    full: 'w-full max-w-none px-0',
  };

  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  );
}

