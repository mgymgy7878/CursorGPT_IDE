export function initialFromSub(sub?: string | null) {
  if (!sub) return "U";
  const s = sub.trim();
  if (!s) return "U";
  const m = s.match(/[A-Za-z0-9]/);
  return (m?.[0] ?? "U").toUpperCase();
} 
