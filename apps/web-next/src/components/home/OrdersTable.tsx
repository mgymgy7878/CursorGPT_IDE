'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Info } from 'lucide-react';

export default function OrdersTable({ rows }: { rows: any[] }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);

  async function dryCancel(order: any) {
    await fetch('/api/copilot/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'orders/cancel',
        params: { id: order?.id },
        dryRun: true,
        confirm_required: true,
        reason: 'dry-run cancel from home',
      }),
    });
  }

  return (
    <div className="h-full rounded-xl border p-3">
      <div className="mb-2 font-medium">Açık Emirler</div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-neutral-900">
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-2">Symbol</th>
              <th className="py-2 pr-2">Side</th>
              <th className="py-2 pr-2">Qty</th>
              <th className="py-2 pr-2">Price</th>
              <th className="py-2 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((r, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSel(r);
                  setOpen(true);
                }}
              >
                <td className="py-2 pr-2">{r.symbol ?? r.id}</td>
                <td className="py-2 pr-2">{r.side}</td>
                <td className="py-2 pr-2">{r.qty ?? r.quantity}</td>
                <td className="py-2 pr-2">{r.px ?? r.price}</td>
                <td className="py-2 pr-2 text-gray-400">
                  <Info size={16} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-4 text-gray-400" colSpan={5}>
                  Emir yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal open={open} title={`Order • ${sel?.symbol ?? ''}`} onClose={() => setOpen(false)}>
        <pre className="text-xs p-3 rounded-lg bg-gray-50 dark:bg-neutral-800 overflow-x-auto">
          {JSON.stringify(sel, null, 2)}
        </pre>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => dryCancel(sel)}
            className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm"
          >
            Dry-Run Cancel
          </button>
          <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg border text-sm">
            Kapat
          </button>
        </div>
      </Modal>
    </div>
  );
}

