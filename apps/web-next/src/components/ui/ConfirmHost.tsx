'use client';
import { useEffect, useState } from 'react';
import ConfirmModal from './ConfirmModal';

export default function ConfirmHost() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    function onAsk(e: any) {
      setPayload(e.detail);
      setOpen(true);
    }
    window.addEventListener('copilot-confirm', onAsk);
    return () => window.removeEventListener('copilot-confirm', onAsk);
  }, []);

  async function doConfirm() {
    const token = localStorage.getItem('admin-token') || '';
    await fetch('/api/copilot/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({
        action: payload.action,
        params: payload.params,
        dryRun: false,
        confirm_required: true,
        reason: 'user confirmed action',
      }),
    });
    setOpen(false);
  }

  return (
    <ConfirmModal
      open={open}
      title="Onay gerekiyor"
      preview={payload?.preview}
      onCancel={() => setOpen(false)}
      onConfirm={doConfirm}
    />
  );
}

