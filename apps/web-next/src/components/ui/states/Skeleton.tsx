'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines,
  ...props
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-neutral-800 rounded';
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  if (lines && lines > 1) {
    return (
      <div className={className} aria-busy="true" aria-label="Yükleniyor..." {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses.text} ${i < lines - 1 ? 'mb-2' : ''}`}
            style={width ? { width } : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-busy="true"
      aria-label="Yükleniyor..."
      {...props}
    />
  );
}

