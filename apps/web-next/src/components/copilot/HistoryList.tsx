'use client';
import { useEffect, useState } from 'react';

const LS_KEY = 'copilot-history';

export default function HistoryList() {
  const [items, setItems] = useState<{ ts: number; cmd: string }[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY) || '[]';
      const parsed = JSON.parse(stored);
      setItems(parsed.reverse());
    } catch {
      setItems([]);
    }
  }, []);

  return (
    <div className="max-h-40 overflow-auto text-xs">
      {items.length === 0 && (
        <div className="text-gray-400 py-2">Komut geçmişi yok</div>
      )}
      {items.map((x, i) => (
        <button
          key={i}
          className="w-full text-left px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-neutral-800"
          onClick={() => {
            const ev = new CustomEvent('copilot-rerun', { detail: x.cmd });
            window.dispatchEvent(ev);
          }}
        >
          <span className="text-gray-500">
            {new Date(x.ts).toLocaleTimeString('tr-TR')}
          </span>{' '}
          — <span className="font-mono">{x.cmd}</span>
        </button>
      ))}
    </div>
  );
}

