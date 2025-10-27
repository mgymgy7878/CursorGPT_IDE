'use client';
import { useEffect, useState } from 'react';

export default function ToastHost() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    function onToast(e: any) {
      const toast = { id: Date.now(), ...e.detail };
      setItems((x) => [...x.slice(-4), toast]);
      
      // Auto-dismiss after 5s
      setTimeout(() => {
        setItems((x) => x.filter((i) => i.id !== toast.id));
      }, 5000);
    }

    window.addEventListener('app-toast', onToast);
    return () => window.removeEventListener('app-toast', onToast);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-[60] space-y-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm pointer-events-auto ${
            t.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          <div className="font-semibold">{t.message}</div>
          {t.description && (
            <div className="text-xs mt-1 opacity-90">{t.description}</div>
          )}
          {t.action && (
            <button
              onClick={t.action.onClick}
              className="mt-2 underline text-sm"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

