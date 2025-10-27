'use client';
import { useState } from 'react';

export default function ConfirmModal({
  open,
  title,
  preview,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  preview?: any;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-neutral-900 shadow-xl p-4">
        <div className="text-lg font-semibold">{title}</div>
        <div className="mt-3 text-sm text-gray-600">
          Aşağıdaki önizlemeyi onaylarsan işlem gerçek olarak yürütülecek.
        </div>
        {preview && (
          <pre className="mt-3 text-xs p-3 rounded-lg bg-gray-50 dark:bg-neutral-800 overflow-x-auto">
            {JSON.stringify(preview, null, 2)}
          </pre>
        )}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-lg border text-sm"
          >
            Vazgeç
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm();
              setBusy(false);
            }}
            className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-60"
          >
            Onayla ve Uygula
          </button>
        </div>
      </div>
    </div>
  );
}

