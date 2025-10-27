'use client';
import { useState } from 'react';
import {
  Activity,
  BarChart3,
  ListOrdered,
  Boxes,
  OctagonAlert,
} from 'lucide-react';

async function call(
  action: string,
  params: any = {},
  opts: any = {}
) {
  return fetch('/api/copilot/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      params,
      dryRun: opts?.dryRun ?? true,
      confirm_required: !!opts?.confirm,
      reason: opts?.reason ?? 'quick action',
    }),
  });
}

export default function CopilotQuick() {
  const [busy, setBusy] = useState(false);

  return (
    <div className="h-full rounded-xl border p-3 flex flex-col gap-2">
      <div className="font-medium mb-1">Copilot Hızlı</div>
      <button
        onClick={() => call('tools/get_status')}
        className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 hover:bg-gray-50"
      >
        <Activity size={16} />
        /health
      </button>
      <button
        onClick={() => call('tools/get_metrics')}
        className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 hover:bg-gray-50"
      >
        <BarChart3 size={16} />
        /metrics
      </button>
      <button
        onClick={() => call('tools/get_orders')}
        className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 hover:bg-gray-50"
      >
        <ListOrdered size={16} />
        /orders
      </button>
      <button
        onClick={() => call('tools/get_positions')}
        className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 hover:bg-gray-50"
      >
        <Boxes size={16} />
        /positions
      </button>
      <div className="mt-1" />
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await call('system/stop_all', {}, { dryRun: true, confirm: true });
          
          // If confirm required, trigger confirm modal
          if (res.ok) {
            const json = await res.json();
            if (json.needsConfirm || json.dryRunResult) {
              const ev = new CustomEvent('copilot-confirm', {
                detail: {
                  action: 'system/stop_all',
                  params: {},
                  preview: json.dryRunResult,
                },
              });
              window.dispatchEvent(ev);
            }
          }
          
          setBusy(false);
        }}
        className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2 disabled:opacity-60 hover:bg-gray-800"
      >
        <OctagonAlert size={16} />
        Stop All (dry-run)
      </button>
    </div>
  );
}

