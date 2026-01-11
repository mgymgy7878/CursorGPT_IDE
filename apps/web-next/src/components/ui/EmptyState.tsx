/**
 * EmptyState - Figma Parity Empty State Component
 *
 * İkonlu ve açıklamalı empty state
 */

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon = '📋', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("py-12 text-center", className)}>
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-lg font-medium text-neutral-200 mb-2">{title}</div>
      {description && (
        <div className="text-sm text-neutral-400 mb-4 max-w-md mx-auto">{description}</div>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

