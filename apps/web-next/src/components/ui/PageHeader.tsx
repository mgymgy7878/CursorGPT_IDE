"use client";
import React from "react";

export default function PageHeaderLegacy({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-400">{subtitle}</p>}
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

export function PageHeader({ title, desc }: {title: string; desc?: string}) {
  return (
    <header className="sticky top-0 z-30 px-6 pt-6 pb-3 bg-black/95 backdrop-blur border-b border-neutral-800">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold truncate">{title}</h1>
          {desc && <p className="text-neutral-400 mt-1">{desc}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <DataModeBadge />
          <SystemHealthDot />
          <OpsQuickHelp />
        </div>
      </div>
    </header>
  );
}
