"use client";
import { useEffect, useState } from "react";

/**
 * Client-only date/time component to prevent hydration mismatches
 */
export function ClientDateTime({ 
  date, 
  format = "locale" 
}: { 
  date: Date | string; 
  format?: "locale" | "relative" | "time" | "date";
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="text-neutral-500">--:--</span>;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === "locale") {
    return <span suppressHydrationWarning>{dateObj.toLocaleString('tr-TR')}</span>;
  }

  if (format === "time") {
    return <span suppressHydrationWarning>{dateObj.toLocaleTimeString('tr-TR')}</span>;
  }

  if (format === "date") {
    return <span suppressHydrationWarning>{dateObj.toLocaleDateString('tr-TR')}</span>;
  }

  if (format === "relative") {
    const now = Date.now();
    const then = dateObj.getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    let relative = "";
    if (minutes < 1) relative = "az önce";
    else if (minutes < 60) relative = `${minutes} dk önce`;
    else if (hours < 24) relative = `${hours} saat önce`;
    else relative = `${days} gün önce`;

    return <span suppressHydrationWarning>{relative}</span>;
  }

  return <span suppressHydrationWarning>{dateObj.toString()}</span>;
}

/**
 * Client-only current time display with auto-refresh
 */
export function ClientNow({ refreshInterval = 1000 }: { refreshInterval?: number }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!now) {
    return <span className="text-neutral-500">--:--:--</span>;
  }

  return <span suppressHydrationWarning>{now.toLocaleTimeString('tr-TR')}</span>;
}

