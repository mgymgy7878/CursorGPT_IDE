'use client';

import AppFrame from '@/components/layout/AppFrame';
import AlertsPageContent, { AlertItem } from '@/components/alerts/AlertsPageContent';

export const dynamic = 'force-dynamic';

// Deterministic mock data for Golden Master
const MOCK_ALERTS: AlertItem[] = [
  {
    id: '1',
    symbol: 'BTCUSDT',
    strategy: 'BTC Mean Reversion',
    condition: 'Above $43,000',
    type: 'price',
    status: 'active',
    createdAt: '2024-11-20',
    lastTriggered: undefined,
    channels: ['In-app', 'Email'],
  },
  {
    id: '2',
    symbol: 'ETHUSDT',
    strategy: 'ETH Momentum',
    condition: 'Below $2,200',
    type: 'price',
    status: 'triggered',
    createdAt: '2024-11-18',
    lastTriggered: '2h ago',
    channels: ['In-app'],
  },
  {
    id: '3',
    symbol: 'AAPL',
    strategy: 'AAPL Long Hold',
    condition: 'Günlük Düşüş $500',
    type: 'pnl',
    status: 'active',
    createdAt: '2024-11-15',
    lastTriggered: undefined,
    channels: ['In-app', 'Email'],
  },
];

export default function GoldenMasterAlertsPage() {
  return (
    <AppFrame>
      <AlertsPageContent
        items={MOCK_ALERTS}
        loading={false}
        onRefresh={() => {}}
        onEnable={() => {}}
        onDelete={() => {}}
        onEdit={() => {}}
      />
    </AppFrame>
  );
}

