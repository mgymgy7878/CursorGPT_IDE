/**
 * PageHeader - Figma Parity Standardized Page Header
 *
 * Tüm sayfalar aynı header yapısını kullanır:
 * - Title (2xl, semibold)
 * - Subtitle (sm, muted)
 * - Badges (status pills, optional)
 * - Actions (buttons, optional)
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { PAGE_PAD_X, PAGE_PAD_TOP, HEADER_GAP } from "@/components/layout/layout-tokens";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Status badge'leri */
  badges?: React.ReactNode;
  /** Eski "chips" desteği (geriye dönük uyumluluk) */
  chips?: React.ReactNode;
  /** Sağ tarafa eylem butonları */
  actions?: React.ReactNode;
  /** Eski "rightSlot" desteği (geriye dönük uyumluluk) */
  rightSlot?: React.ReactNode;
  /** Padding uygulanmasın (sayfa zaten padding veriyor) */
  noPadding?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badges,
  chips,
  actions,
  rightSlot,
  noPadding = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6",
        !noPadding && `px-[${PAGE_PAD_X}px] pt-[${PAGE_PAD_TOP}px]`,
        className
      )}
      style={!noPadding ? {
        paddingLeft: `${PAGE_PAD_X}px`,
        paddingRight: `${PAGE_PAD_X}px`,
        paddingTop: `${PAGE_PAD_TOP}px`,
      } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Figma parity: text-2xl font-semibold leading-tight */}
          <h1 className="text-2xl font-semibold text-neutral-200 leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
          {/* Badges veya chips */}
          {(badges || chips) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {badges ?? chips}
            </div>
          )}
        </div>

        {/* Actions (öncelik: actions → rightSlot) */}
        {(actions || rightSlot) && (
          <div className="flex items-center gap-2 shrink-0">
            {actions ?? rightSlot}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
