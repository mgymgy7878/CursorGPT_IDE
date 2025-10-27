'use client';
import Link from 'next/link';

export default function AlertsMini({ items }: { items: any[] }) {
  return (
    <div className="h-full rounded-xl border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Uyarılar</div>
        <Link
          href="/alerts"
          className="text-sm text-gray-500 hover:underline"
        >
          Tümü →
        </Link>
      </div>
      <div className="space-y-2">
        {items.slice(0, 6).map((a: any, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                a.level === 'critical'
                  ? 'bg-red-500'
                  : a.level === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              }`}
            />
            <div className="text-xs flex-1 min-w-0">
              <div className="font-medium truncate">{a.source}</div>
              <div className="text-gray-500 truncate">{a.message}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-gray-400 text-sm">Uyarı yok</div>
        )}
      </div>
    </div>
  );
}

