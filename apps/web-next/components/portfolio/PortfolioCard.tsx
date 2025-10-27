import React from 'react';

export interface PortfolioCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Portfolio section card wrapper
 * Used for Exchange Connection, Total PnL, and Account Summary cards
 */
export function PortfolioCard({
  title,
  children,
  icon,
  actions,
  className = '',
  testId,
}: PortfolioCardProps) {
  return (
    <div
      className={`bg-card rounded-lg border border-border p-6 hover:border-border-hover transition-colors ${className}`}
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <div className="text-text-muted">{icon}</div>}
          <h3 className="text-sm font-medium text-text-muted">{title}</h3>
        </div>
        {actions}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export interface MetricRowProps {
  label: string;
  value: string | number;
  valueClassName?: string;
  sublabel?: string;
}

/**
 * Metric row inside portfolio cards
 * Label on left, value on right
 */
export function MetricRow({ label, value, valueClassName = 'text-text-strong', sublabel }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold tabular ${valueClassName}`}>{value}</span>
        {sublabel && <div className="text-xs text-text-muted">{sublabel}</div>}
      </div>
    </div>
  );
}

