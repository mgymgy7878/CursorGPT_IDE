'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGlobalTicker } from '@/hooks/useGlobalTicker';

type ClientTimeProps = {
  value?: number | string | Date; // optional timestamp/date
  fallback?: string;
  locale?: string;
  timeZone?: string;
  format?: 'time' | 'datetime' | 'date' | 'relative';
  showTooltip?: boolean; // Show full datetime in tooltip for relative format
  minWidth?: string; // Context-aware min-width (default: '4ch' for relative, 'auto' for others)
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
  showTooltip = true,
  minWidth,
}: ClientTimeProps) {
  const [text, setText] = useState(fallback);
  const [mounted, setMounted] = useState(false);

  // Use global ticker for relative format to prevent multiple intervals
  const globalTick = useGlobalTicker();

  const d = useMemo(() => {
    if (!value) return new Date();
    return value instanceof Date ? value : new Date(value);
  }, [value]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      if (format === 'relative') {
        const now = format === 'relative' ? globalTick : Date.now();
        const then = d.getTime();
        const diff = now - then;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        let relative = '';
        if (seconds < 1) relative = 'az önce';
        else if (seconds < 60) relative = `${seconds} sn önce`;
        else if (minutes < 60) relative = `${minutes} dk önce`;
        else if (hours < 24) relative = `${hours} sa önce`;
        else relative = `${days} gün önce`;

        setText(relative);
        return;
      }

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

    // For current time (no value), use global ticker if relative, otherwise own interval
    if (!value && format !== 'relative') {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [d, locale, timeZone, format, value, globalTick]);

  // Layout shift prevention: use tabular-nums and context-aware min-width
  // Default: 8ch (covers most cases: "2 sn önce" to "11 gün önce")
  // Table rows: 10ch (recommended for list contexts)
  // Worst-case (123+ days): 12ch (if needed in future)
  const defaultMinWidth = format === 'relative' ? '8ch' : 'auto';
  const finalMinWidth = minWidth || defaultMinWidth;
  const className = format === 'relative'
    ? 'tabular-nums inline-block'
    : '';

  // Tooltip for relative format (shows full datetime)
  const tooltipText = format === 'relative' && showTooltip && mounted && value
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone,
      }).format(d)
    : undefined;

  return (
    <span
      suppressHydrationWarning
      className={className}
      style={format === 'relative' ? { minWidth: finalMinWidth } : undefined}
      title={tooltipText}
      aria-label={tooltipText ? `${text} (${tooltipText})` : text}
    >
      {mounted ? text : fallback}
    </span>
  );
}

