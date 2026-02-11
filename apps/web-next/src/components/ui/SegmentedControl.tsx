/**
 * SegmentedControl - Pill-style segmented toggle (Figma parity)
 *
 * Used for category selection (Kripto/BIST/Hisse/etc) and view toggles
 * Active segment has filled background, inactive segments are subtle
 */

'use client';

import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-[11px]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-1 rounded-full',
        'bg-[#0b0d10] border border-white/10',
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'font-medium rounded-full transition-all',
              sizeClasses[size],
              isActive
                ? 'bg-white text-black shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

