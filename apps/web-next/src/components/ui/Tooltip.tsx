/**
 * Tooltip - PATCH W
 *
 * Sıfır bağımlılık tooltip bileşeni. Klavye/focus desteği ile erişilebilir.
 */

'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  className?: string;
  /** PATCH W.1 Polish: Portal opsiyonu - overflow container'lar için document.body'ye render */
  portal?: boolean;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 200, // PATCH W.1: 150-250ms standard (200ms default)
  className,
  portal = false, // PATCH W.1 Polish: Portal varsayılan false (backward compatibility)
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current && tooltipRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (side) {
          case 'top':
            top = triggerRect.top - tooltipRect.height - 8;
            left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case 'bottom':
            top = triggerRect.bottom + 8;
            left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case 'left':
            top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.left - tooltipRect.width - 8;
            break;
          case 'right':
            top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.right + 8;
            break;
        }

        // Align adjustment
        if (align === 'start') {
          if (side === 'top' || side === 'bottom') {
            left = triggerRect.left;
          } else {
            top = triggerRect.top;
          }
        } else if (align === 'end') {
          if (side === 'top' || side === 'bottom') {
            left = triggerRect.right - tooltipRect.width;
          } else {
            top = triggerRect.bottom - tooltipRect.height;
          }
        }

        // Boundary check
        const padding = 8;
        if (left < padding) left = padding;
        if (left + tooltipRect.width > window.innerWidth - padding) {
          left = window.innerWidth - tooltipRect.width - padding;
        }
        if (top < padding) top = padding;
        if (top + tooltipRect.height > window.innerHeight - padding) {
          top = window.innerHeight - tooltipRect.height - padding;
        }

        setPosition({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // PATCH W.1: Scroll başlayınca tooltip kapanma
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        hideTooltip();
      }
    };

    // Scroll event'lerini dinle (window + scroll container'lar)
    window.addEventListener('scroll', handleScroll, true); // capture phase
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('scroll', handleScroll, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  // PATCH W.1: ESC ile tooltip kapatma (klavye erişilebilirliği)
  useEffect(() => {
    if (!isVisible) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideTooltip();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isVisible]);

  const tooltipContent = isVisible ? (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={cn(
        'fixed z-[100] px-2 py-1 text-[11px] font-medium rounded-md',
        'bg-neutral-800 border border-neutral-700 text-neutral-200',
        'shadow-lg pointer-events-none',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        // PATCH W.1: Tooltip clipping önleme (overflow container'lar için)
        'max-w-[200px] break-words',
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {content}
      <div
        className={cn(
          'absolute w-2 h-2 bg-neutral-800 border-neutral-700 rotate-45',
          side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b',
          side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t',
          side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-t',
          side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2 border-l border-b'
        )}
      />
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {/* PATCH W.1 Polish: Portal opsiyonu - overflow container'lar için document.body'ye render */}
      {portal && typeof document !== 'undefined'
        ? createPortal(tooltipContent, document.body)
        : tooltipContent}
    </>
  );
}

