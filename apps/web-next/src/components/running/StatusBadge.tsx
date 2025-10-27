export default function StatusBadge({ status }:{status:"running"|"stopped"|"error"|"draft"}) {
  const map = {
    running: "bg-emerald-100 text-emerald-700",
    stopped: "bg-neutral-100 text-neutral-700",
    error: "bg-red-100 text-red-700",
    draft: "bg-yellow-100 text-yellow-700",
  } as const;
  return <span className={`px-2 py-1 rounded-lg text-xs ${map[status]}`}>{status}</span>;
}
