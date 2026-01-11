/**
 * PageShell - Global Viewport Budget Manager (PATCH G/H)
 *
 * Tek standart container: tüm sayfalarda aynı yükseklik matematiği
 * - Body scroll: 0 (tüm sayfalarda)
 * - Hiçbir kartta metin/alt satır kırpılmasın
 * - Sayfa "yukarı yapışmasın": nefes alan ama bütçeyi aşmayan üst boşluk
 * - 1366x768 @100/110/125% zoom'da okunaklı ve tam görünür
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** Header alanı (opsiyonel) - sıkı ama nefes alan padding */
  header?: ReactNode;
}

export function PageShell({ children, header, className }: PageShellProps) {
  return (
    <div
      className={cn(
        'h-[calc(100vh-var(--app-topbar-h,48px))] min-h-0 overflow-hidden flex flex-col',
        className
      )}
    >
      {header && (
        <div className="shrink-0 px-[var(--page-px,12px)] pt-[var(--page-pt,10px)]">
          {header}
        </div>
      )}
      <div
        className={cn(
          'flex-1 min-h-0 overflow-hidden',
          header ? 'px-[var(--page-px,12px)] pb-[var(--page-pb,10px)]' : 'px-[var(--page-px,12px)] py-[var(--page-py,10px)]'
        )}
      >
        {children}
      </div>
    </div>
  );
}

