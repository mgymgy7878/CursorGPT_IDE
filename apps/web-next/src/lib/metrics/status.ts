export function getStatusVisual(status: string|undefined) {
  const s = (status?.toString?.() ?? "UNKNOWN").toUpperCase();
  if (s === "ALERT" || s === "RED")   return { statusColor: "text-red-400",    statusIcon: "⛔" };
  if (s === "WARN"  || s === "AMBER") return { statusColor: "text-amber-400",  statusIcon: "⚠️" };
  if (s === "OK"    || s === "GREEN") return { statusColor: "text-emerald-400",statusIcon: "✅" };
  return { statusColor: "text-neutral-400", statusIcon: "•" };
}
