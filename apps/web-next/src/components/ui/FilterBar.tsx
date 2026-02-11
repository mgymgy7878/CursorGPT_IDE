/**
 * FilterBar - Chip/segmented filter bar
 *
 * Figma parity: Market (Crypto/FX/BIST), Status (Running/Paused/Stuck), Search
 * Same visual language as RightRail quick action chips
 */

import { cn } from '@/lib/utils';
import { Input } from './Input';

export interface FilterChip {
  id: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export interface FilterBarProps {
  chips?: FilterChip[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

export function FilterBar({ chips, searchPlaceholder, searchValue, onSearchChange, className }: FilterBarProps) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {chips && chips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onClick}
              className={cn(
                'px-2.5 py-1 text-xs rounded-md border transition-colors',
                chip.active
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                  : 'bg-neutral-500/20 border-neutral-500/30 text-neutral-400 hover:bg-neutral-500/30'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
      {searchPlaceholder && (
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
}

