'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-neutral-800 rounded ${className}`}>
      {children}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'Henüz veri yok',
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-neutral-400 text-sm font-medium mb-2">{title}</div>
      {description && (
        <div className="text-neutral-500 text-xs mb-4">{description}</div>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  error?: string | Error;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Bir hata oluştu',
  error,
  onRetry
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error || 'Bilinmeyen hata';

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-400 text-sm font-medium mb-2">{title}</div>
      <div className="text-neutral-500 text-xs mb-4">{errorMessage}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Tekrar Dene
        </button>
      )}
    </div>
  );
}
