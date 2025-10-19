'use client';
import { t } from '@/lib/i18n';

export interface StatusPillsProps {
  env: string;
  feed: 'Healthy' | 'Degraded' | 'Down' | string;
  broker: 'Online' | 'Offline' | string;
}

export default function StatusPills({ env, feed, broker }: StatusPillsProps) {
  const pill = (label: string, tone: 'neutral' | 'success' | 'warn' | 'danger' = 'neutral') => (
    <span
      className={`px-2.5 py-1 text-xs rounded-full
        ${tone === 'success' ? 'bg-green-500/15 text-green-300'
        : tone === 'warn'   ? 'bg-amber-500/15 text-amber-300'
        : tone === 'danger' ? 'bg-red-500/15 text-red-300'
                            : 'bg-card text-neutral-300'}`}>
      {label}
    </span>
  );

  // Map EN to TR
  const statusMap: Record<string, string> = {
    'Healthy': t('status.healthy'),
    'Degraded': t('status.degraded'),
    'Down': t('status.down'),
    'Online': t('status.online'),
    'Offline': t('status.offline'),
    'Mock': t('status.mock'),
  };

  const feedText = statusMap[feed] || feed;
  const brokerText = statusMap[broker] || broker;
  const envText = statusMap[env] || env;

  return (
    <div className="flex gap-2 flex-wrap">
      {pill(`${t('status.env')}: ${envText}`, 'neutral')}
      {pill(
        `${t('status.feed')}: ${feedText}`,
        feed === 'Healthy' ? 'success' : feed === 'Degraded' ? 'warn' : 'danger'
      )}
      {pill(`${t('status.broker')}: ${brokerText}`, broker === 'Online' ? 'success' : 'warn')}
    </div>
  );
}

