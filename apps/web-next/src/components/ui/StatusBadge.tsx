type Status = "success" | "warn" | "error" | "info" | "neutral";

export interface StatusBadgeProps {
  status: Status;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const base = "inline-flex items-center rounded-md px-2 py-0.5 text-sm font-medium num-tight";
  const map: Record<Status, string> = {
    success: "bg-status-success/15 text-status-success",
    warn: "bg-status-warn/15 text-status-warn",
    error: "bg-status-error/15 text-status-error",
    info: "bg-status-info/15 text-status-info",
    neutral: "bg-status-neutral/15 text-status-neutral",
  };
  
  const classes = [base, map[status], className].filter(Boolean).join(' ');
  
  return <span className={classes}>{label}</span>;
}

export default StatusBadge;

