'use client';

import React from 'react';
import { Button } from '../button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
      style={{
        paddingTop: 'var(--empty-state-py, 24px)',
        paddingBottom: 'var(--empty-state-py, 24px)',
        paddingLeft: 'var(--card-pad, 12px)',
        paddingRight: 'var(--card-pad, 12px)',
      }}
      role="status"
      aria-live="polite"
    >
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-neutral-400 mb-6 max-w-md">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

