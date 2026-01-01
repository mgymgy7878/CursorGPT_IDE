/**
 * PATCH J: Header Unification
 *
 * Bu dosya artık common/PageHeader.tsx'den re-export yapıyor.
 * Tek kaynak: apps/web-next/src/components/common/PageHeader.tsx
 *
 * Legacy wrapper'lar aşağıda korunuyor (geriye dönük uyumluluk için)
 */

"use client";
import React from "react";
import { PageHeader as CommonPageHeader, type PageHeaderProps } from '@/components/common/PageHeader';

// Legacy wrapper (geriye dönük uyumluluk)
export default function PageHeaderLegacy({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-[18px] font-semibold tracking-tight leading-none">{title}</h1>
          {subtitle && <p className="text-[11px] text-neutral-400">{subtitle}</p>}
        </div>
        {actions ? <div className="shrink-0 flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

import OpsQuickHelp from "./OpsQuickHelp";
import SystemHealthDot from "@/components/dashboard/SystemHealthDot";
import DataModeBadge from "./DataModeBadge";

// Sticky header variant (observability gibi sayfalar için)
export function PageHeader({ title, desc }: {title: string; desc?: string}) {
  return (
    <header className="sticky top-0 z-30 px-6 pt-3 pb-1.5 bg-black/95 backdrop-blur border-b border-neutral-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-[18px] font-semibold leading-none">{title}</h1>
          {desc && <p className="text-[11px] text-neutral-400 mt-0.5">{desc}</p>}
        </div>
        <div className="flex items-center gap-3">
          <DataModeBadge />
          <SystemHealthDot />
          <OpsQuickHelp />
        </div>
      </div>
    </header>
  );
}

// Re-export common PageHeader as primary export
export { CommonPageHeader as PageHeaderStandard, type PageHeaderProps };
