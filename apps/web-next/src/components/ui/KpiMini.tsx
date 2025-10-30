import React from 'react';
import { StatusDot } from '@/components/status-dot';
import type { ServiceStatus } from '@/hooks/useUnifiedStatus';

interface KpiMiniProps {
  label: string;
  value: string;
  tone?: 'ok' | 'warn' | 'danger' | 'muted';
  dot?: ServiceStatus;
}

export default function KpiMini({ label, value, tone = 'muted', dot }: KpiMiniProps) {
  const toneColors = {
    ok: 'text-[color:var(--ok)]',
    warn: 'text-[color:var(--warn-color)]',
    danger: 'text-[color:var(--danger-color)]',
    muted: 'text-white',
  };

  return (
    <div className="rounded-xl bg-white/2 px-3 py-2 flex items-center gap-2 min-h-[48px]">
      {dot && <StatusDot status={dot} />}
      <div className="text-xs text-neutral-400">{label}</div>
      <div className={`ml-auto text-sm font-medium ${toneColors[tone]}`}>{value}</div>
    </div>
  );
}
