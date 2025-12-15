import React from 'react';

type Status = "success" | "warn" | "error" | "info" | "neutral";
type WSStatus = "connected" | "paused" | "reconnecting" | "stale" | "error";

export interface StatusBadgeProps {
  status: Status;
  label: string;
  className?: string;
  icon?: React.ReactNode;
}

export interface WSStatusBadgeProps {
  status: WSStatus;
  stalenessMs?: number;
  className?: string;
}

export function StatusBadge({ status, label, className, icon }: StatusBadgeProps) {
  const base = "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-medium num-tight";
  const map: Record<Status, string> = {
    success: "bg-status-success/15 text-status-success",
    warn: "bg-status-warn/15 text-status-warn",
    error: "bg-status-error/15 text-status-error",
    info: "bg-status-info/15 text-status-info",
    neutral: "bg-status-neutral/15 text-status-neutral",
  };

  const classes = [base, map[status], className].filter(Boolean).join(' ');

  return (
    <span className={classes} aria-label={label}>
      {icon && <span className="text-xs">{icon}</span>}
      {label}
    </span>
  );
}

export function WSStatusBadge({ status, stalenessMs, className }: WSStatusBadgeProps) {
  const statusMap: Record<WSStatus, { label: string; icon: string; status: Status }> = {
    connected: { label: "Bağlı", icon: "🟢", status: "success" },
    paused: { label: "Duraklatıldı", icon: "⏸️", status: "warn" },
    reconnecting: { label: "Yeniden bağlanıyor...", icon: "🟡", status: "warn" },
    stale: { label: stalenessMs ? `Eski (${Math.floor(stalenessMs / 1000)}s)` : "Eski", icon: "🟠", status: "warn" },
    error: { label: "Bağlantı hatası", icon: "🔴", status: "error" },
  };

  const config = statusMap[status];
  const ariaLabel = stalenessMs
    ? `${config.label}, son mesaj ${Math.floor(stalenessMs / 1000)} saniye önce`
    : config.label;

  return (
    <StatusBadge
      status={config.status}
      label={config.label}
      icon={config.icon}
      className={className}
      aria-label={ariaLabel}
    />
  );
}

export default StatusBadge;

