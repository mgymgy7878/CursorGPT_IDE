/**
 * RailHandle - Sol/Sağ panel toggle butonu (Figma Parity)
 *
 * Divider üzerinde TAM ORTA hizada, aynı stil ve boyutta.
 * Props:
 *   - side: "left" | "right"
 *   - isOpen: panel açık mı
 *   - onToggle: toggle handler
 */

'use client';

import { cn } from '@/lib/utils';
import { HANDLE_WIDTH, HANDLE_HEIGHT, HANDLE_RADIUS } from './layout-tokens';

interface RailHandleProps {
  side: 'left' | 'right';
  isOpen: boolean;
  onToggle: () => void;
}

export function RailHandle({ side, isOpen, onToggle }: RailHandleProps) {
  // Chevron yönü: sol panel açıkken sola, sağ panel açıkken sağa gösterir
  const chevronDirection = side === 'left'
    ? (isOpen ? '◀' : '▶')
    : (isOpen ? '▶' : '◀');

  const ariaLabel = side === 'left'
    ? (isOpen ? 'Menüyü daralt' : 'Menüyü genişlet')
    : (isOpen ? 'Copilot panelini kapat' : 'Copilot panelini aç');

  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center justify-center",
        // Figma pill style: darker bg, subtle border
        "bg-black/40 border border-white/10 backdrop-blur-sm",
        "hover:bg-white/5 hover:border-white/15 active:bg-white/10",
        "transition-all duration-150",
        "text-white/50 hover:text-white/80 text-[11px]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
        "shadow-md"
      )}
      style={{
        width: `${HANDLE_WIDTH}px`,
        height: `${HANDLE_HEIGHT}px`,
        borderRadius: `${HANDLE_RADIUS}px`,
      }}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span className="leading-none">{chevronDirection}</span>
    </button>
  );
}

/**
 * DividerWithHandle - Divider ve handle'ı içeren wrapper
 * Handle divider'ın tam ortasında durur
 */
interface DividerWithHandleProps {
  side: 'left' | 'right';
  isOpen: boolean;
  onToggle: () => void;
  showDivider?: boolean;
}

export function DividerWithHandle({ side, isOpen, onToggle, showDivider = true }: DividerWithHandleProps) {
  return (
    <div className="relative shrink-0 flex items-center justify-center z-30">
      {/* Divider line */}
      {showDivider && (
        <div className="absolute inset-y-0 w-px bg-white/6 hover:bg-white/12 transition-colors" />
      )}

      {/* Handle - tam ortada */}
      <RailHandle
        side={side}
        isOpen={isOpen}
        onToggle={onToggle}
      />
    </div>
  );
}
