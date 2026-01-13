/**
 * SparkAvatar - Figma Parity PATCH H
 *
 * Markalı avatar: gradient + Spark/Lightning işareti
 * Premium hissi için daha büyük ve belirgin
 */

'use client';

import { IconSpark } from '@/components/ui/LocalIcons';
import { cn } from '@/lib/utils';

interface SparkAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SparkAvatar({ size = 'md', className }: SparkAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <div
      className={cn(
        'rounded-lg bg-gradient-to-br from-emerald-500/30 via-blue-500/20 to-purple-500/20',
        'border border-white/20 shadow-lg shadow-emerald-500/10',
        'flex items-center justify-center',
        'backdrop-blur-sm',
        sizeClasses[size],
        className
      )}
    >
      <IconSpark
        size={iconSizes[size]}
        strokeWidth={2}
        className="text-emerald-300 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"
      />
    </div>
  );
}
