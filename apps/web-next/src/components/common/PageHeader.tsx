"use client";
import React from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Dashboard'taki küçük filtre/etiket bölümü */
  chips?: React.ReactNode;
  /** Sağ tarafa eylem butonları */
  actions?: React.ReactNode;
  /** Eski kullanım uyumluluğu (varsa korunur) */
  rightSlot?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  chips,
  actions,
  rightSlot,
  className,
}: PageHeaderProps) {
  return (
    <header className={className ?? "mb-6"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          ) : null}
          {chips ? <div className="mt-2">{chips}</div> : null}
        </div>
        {/* Öncelik: actions → rightSlot */}
        {actions ?? rightSlot ?? null}
      </div>
    </header>
  );
}

export default PageHeader;

