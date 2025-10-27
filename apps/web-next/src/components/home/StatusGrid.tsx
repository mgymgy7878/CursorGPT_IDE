'use client';
import { Card, Text, Metric, Badge } from '@tremor/react';

export default function StatusGrid({ status }: { status: any }) {
  const items = [
    { key: 'executor', name: 'Executor', ok: !!status?.executor?.ok },
    { key: 'ml', name: 'ML Engine', ok: !!status?.ml?.ok },
    { key: 'streams', name: 'Streams', ok: !!status?.streams?.ok },
    { key: 'export', name: 'Export', ok: !!status?.export?.ok },
    { key: 'optimizer', name: 'Optimizer', ok: !!status?.optimizer?.ok },
    { key: 'gates', name: 'Gates', ok: !!status?.gates?.ok },
  ];

  return (
    <Card className="h-full">
      <Text className="mb-3 font-semibold">Servis Durumu</Text>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <div
            key={it.key}
            className="flex items-center justify-between p-2 rounded border border-gray-200"
          >
            <div>
              <Text className="text-xs">{it.name}</Text>
              <Metric className="text-sm">{it.ok ? 'UP' : 'DOWN'}</Metric>
            </div>
            <Badge color={it.ok ? 'green' : 'red'} size="xs">
              {it.ok ? '🟢' : '🔴'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

