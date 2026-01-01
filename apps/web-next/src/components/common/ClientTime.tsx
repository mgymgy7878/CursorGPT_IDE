'use client';

import { useEffect, useMemo, useState } from 'react';

type ClientTimeProps = {
  value?: number | string | Date; // optional timestamp/date
  fallback?: string;
  locale?: string;
  timeZone?: string;
  format?: 'time' | 'datetime' | 'date';
};

/**
 * ClientTime - SSR-safe time display component
 *
 * Server render outputs a stable fallback text (e.g., "—")
 * After mount, render formatted time on client
 * Prevents hydration mismatch errors
 */
export function ClientTime({
  value,
  fallback = '—',
  locale = 'tr-TR',
  timeZone = 'Europe/Istanbul',
  format = 'time',
}: ClientTimeProps) {
  const [text, setText] = useState(fallback);
  const [mounted, setMounted] = useState(false);

  const d = useMemo(() => {
    if (!value) return new Date();
    return value instanceof Date ? value : new Date(value);
  }, [value]);

  useEffect(() => {
    setMounted(true);

    const updateTime = () => {
      let fmt: Intl.DateTimeFormat;

      if (format === 'time') {
        fmt = new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone,
        });
      } else if (format === 'datetime') {
        fmt = new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone,
        });
      } else {
        fmt = new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone,
        });
      }

      setText(fmt.format(d));
    };

    updateTime();

    // If showing current time (no value prop), update every second
    if (!value) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [d, locale, timeZone, format, value]);

  return <span suppressHydrationWarning>{mounted ? text : fallback}</span>;
}

