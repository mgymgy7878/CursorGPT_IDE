'use client';
import React from 'react';

type Chip = { label: string; tone?: 'success' | 'warn' | 'info' | 'muted' };
type Action = { label: string; onClick: () => void; variant?: 'primary' | 'ghost' };

export interface PageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  chips?: Chip[];
  actions?: Action[];
}

export default function PageHeader({
  title,
  subtitle,
  chips = [],
  actions = []
}: PageHeaderProps) {
  const toneClass = (t?: Chip['tone']) =>
    t === 'success' ? 'text-green-400' :
    t === 'warn'    ? 'text-amber-300' :
    t === 'info'    ? 'text-sky-300' :
                      'text-neutral-400';

  return (
    <div className="flex items-start justify-between gap-4 pb-4 flex-wrap">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold truncate">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}
        {chips.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {chips.map((c, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 text-xs rounded-full bg-card/60 ${toneClass(c.tone)}`}>
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex gap-2 shrink-0 flex-wrap">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className={`px-3 py-2 rounded-xl transition shrink-0
                ${a.variant === 'ghost'
                  ? 'bg-transparent hover:bg-card'
                  : 'bg-sky-600 hover:bg-sky-700 text-white'}`}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

