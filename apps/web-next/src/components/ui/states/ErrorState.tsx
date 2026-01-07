'use client';

import React from 'react';
import { Button } from '../button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Bir hata oluştu',
  message,
  onRetry,
  retryLabel = 'Tekrar dene',
  className = ''
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="mb-4 text-4xl">⚠️</div>
      <h3 className="text-lg font-semibold mb-2 text-red-400">{title}</h3>
      <p className="text-neutral-400 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="default">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

