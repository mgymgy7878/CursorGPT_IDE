/**
 * CompactPageHeader - Figma Parity Kompakt Sayfa Başlığı
 *
 * Terminal yoğunluğu için optimize edilmiş header:
 * - Tek satırlık kompakt başlık
 * - Subtitle opsiyonel ve küçük
 * - Actions aynı satırda sağda
 * - Minimal dikey padding
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CompactPageHeaderProps {
  title: string;
  subtitle?: string;
  /** Sağ tarafa eylem butonları */
  actions?: React.ReactNode;
  className?: string;
}

export function CompactPageHeader({
  title,
  subtitle,
  actions,
  className,
}: CompactPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 py-4",
        className
      )}
    >
      {/* Sol: Başlık + opsiyonel subtitle */}
      <div className="flex items-baseline gap-3 min-w-0 flex-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] leading-none text-neutral-200 truncate">
          {title}
        </h1>
        {subtitle && (
          <span className="text-[13px] text-neutral-400 leading-none whitespace-nowrap">
            {subtitle}
          </span>
        )}
      </div>

      {/* Sağ: Actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

export default CompactPageHeader;

