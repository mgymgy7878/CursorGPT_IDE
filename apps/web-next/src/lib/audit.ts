export type AuditEvent = { ts: number; type: string; id?: string; meta?: any };
const KEY = "recent_actions_v1";

export function getRecent(): AuditEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushAudit(ev: AuditEvent) {
  try {
    const cur = getRecent();
    cur.unshift({ ...ev, ts: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(cur.slice(0, 20)));
  } catch {}
}


