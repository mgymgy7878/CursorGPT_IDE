export type AuditEvent = {
  ts: number;
  type: string;
  details?: Record<string, unknown>;
  actor?: string;
};

const CAP = 1000;
const buf: AuditEvent[] = [];

export function log(evt: AuditEvent) {
  buf.push(evt);
  if (buf.length > CAP) buf.shift();
}

export function tail(limit = 200): AuditEvent[] {
  if (limit < 1) limit = 1;
  if (limit > CAP) limit = CAP;
  return buf.slice(-limit);
}


