/**
 * ConnectionHealthCard - Single source of truth for connection status
 *
 * Uses the same hooks as StatusBar to ensure consistency:
 * - useHeartbeat() for API status
 * - useWsHeartbeat() for WS status
 * - useExecutorHealth() for Executor status
 */

'use client';

import { Surface } from '@/components/ui/Surface';
import { ClientTime } from '@/components/common/ClientTime';
import { useExecutorHealth } from '@/hooks/useExecutorHealth';
import { useWsHeartbeat } from '@/hooks/useWsHeartbeat';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function ConnectionHealthCard() {
  const apiOk = useHeartbeat();
  const wsOk = useWsHeartbeat();
  const { healthy: executorOk } = useExecutorHealth();
  const [lastTestAt, setLastTestAt] = useState<number>(Date.now());

  // Update lastTestAt when any status changes
  useEffect(() => {
    setLastTestAt(Date.now());
  }, [apiOk, wsOk, executorOk]);

  return (
    <div className="mb-4">
      <Surface variant="card" className="p-3">
        <div className="text-xs font-medium text-neutral-300 mb-2">Connection Health</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center justify-between p-2 rounded bg-neutral-900/30 border border-neutral-800">
            <span className="text-[10px] text-neutral-400">API</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border",
              apiOk
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            )}>
              {apiOk ? 'Healthy' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-neutral-900/30 border border-neutral-800">
            <span className="text-[10px] text-neutral-400">WS</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border",
              wsOk
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            )}>
              {wsOk ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-neutral-900/30 border border-neutral-800">
            <span className="text-[10px] text-neutral-400">Executor</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border",
                executorOk
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              )}
              title={executorOk ? undefined : 'Executor service is offline. Check port 4001 or executor service status.'}
            >
              {executorOk ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="mt-2 text-[9px] text-neutral-500">
          Son test: <ClientTime value={lastTestAt} format="datetime" />
        </div>
      </Surface>
    </div>
  );
}

