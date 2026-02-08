/**
 * RailHandle - Sol/sağ panel toggle (DividerWithHandle ile kullanılır)
 * Hit-area w-11 h-14 (WCAG); görünen pill w-6 h-14 — RightRailHandle ile aynı token yapısı.
 */

'use client';

import { cn } from '@/lib/utils';
import { IconChevronLeft, IconChevronRight } from '@/components/ui/LocalIcons';

interface RailHandleProps {
  side: 'left' | 'right';
  isOpen: boolean;
  onToggle: () => void;
}

export function RailHandle({ side, isOpen, onToggle }: RailHandleProps) {
  const ariaLabel = side === 'left'
    ? (isOpen ? 'Menüyü daralt' : 'Menüyü genişlet')
    : (isOpen ? 'Copilot panelini kapat' : 'Copilot panelini aç');
  const Icon = side === 'left'
    ? (isOpen ? IconChevronLeft : IconChevronRight)
    : (isOpen ? IconChevronRight : IconChevronLeft);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "group relative grid h-14 w-11 place-items-center",
        "hover:bg-transparent active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      )}
    >
      <span
        className={cn(
          "pointer-events-none grid h-14 w-6 place-items-center rounded-full",
          "border border-white/10 bg-neutral-900/70 backdrop-blur shadow-md",
          "transition-colors duration-150",
          "group-hover:bg-neutral-800/80"
        )}
      >
        <Icon size={16} strokeWidth={2} className="h-4 w-4 opacity-80" />
      </span>
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
