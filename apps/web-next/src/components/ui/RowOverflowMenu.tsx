/**
 * RowOverflowMenu - Responsive overflow menu for table row actions
 *
 * PATCH W.4: Actions kolonu lg breakpoint'in altında gizlenince,
 * overflow menu (⋯) ile action'lara erişim sağlar.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RowActionsVertical } from './RowActions';

export interface RowOverflowMenuProps {
  children: React.ReactNode; // RowActions içeriği
  className?: string;
}

export function RowOverflowMenu({ children, className }: RowOverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      {/* Overflow button - lg'den küçük ekranlarda görünür */}
      <div className="lg:hidden">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          aria-label="İşlemler"
          className="inline-flex items-center justify-center w-6 h-6 rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
        >
          ⋯
        </button>
      </div>

      {/* Menu dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-1">
            <RowActionsVertical>
              {children}
            </RowActionsVertical>
          </div>
        </div>
      )}

      {/* Desktop: Normal RowActions (lg ve üzeri) */}
      <div className="hidden lg:block">
        {children}
      </div>
    </div>
  );
}

