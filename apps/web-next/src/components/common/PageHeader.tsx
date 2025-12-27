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
        "mb-2",
        className
      )}
      style={!noPadding ? {
        paddingTop: 'var(--page-header-py, 10px)',
        paddingBottom: 'var(--page-header-py, 10px)',
      } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* PATCH Q: Token-based h1 size + glance'da subtitle gizle */}
          <h1
            className="font-semibold text-neutral-200 leading-none truncate"
            style={{ fontSize: 'var(--h1-size, 18px)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-neutral-400 mt-0.5 leading-relaxed glance-hide-subtitle"
              style={{ fontSize: 'var(--h2-size, 14px)' }}
            >
              {subtitle}
            </p>
          )}
          {/* Badges veya chips */}
          {(badges || chips) && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
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
