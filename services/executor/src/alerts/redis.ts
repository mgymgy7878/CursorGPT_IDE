import IORedis from 'ioredis';

const url = process.env.REDIS_URL || 'redis://localhost:6379';
export const NS = (process.env.REDIS_NAMESPACE || 'spark:alerts').replace(/:+$/, '');
export const R = new IORedis(url, { maxRetriesPerRequest: 2, lazyConnect: true });

export function k(...parts: (string | number)[]) {
  return [NS, ...parts].join(':');
}

/**
 * Key structures:
 *  - alerts:index                  → SET (all active alert IDs)
 *  - alert:{id}                    → HASH (alert body: json, active, createdAt, lastTriggeredAt)
 *  - alert:{id}:events             → LIST (last N event JSON)
 */

export async function upsertAlert(a: any) {
  const id = a.id;
  const pipe = R.multi();
  pipe.sadd(k('alerts:index'), id);
  pipe.hset(k('alert', id), {
    json: JSON.stringify(a),
    active: a.active ? '1' : '0',
    createdAt: String(a.createdAt ?? Date.now()),
    lastTriggeredAt: String(a.lastTriggeredAt ?? 0),
  });
  await pipe.exec();
}

export async function getAlert(id: string) {
  const h = await R.hgetall(k('alert', id));
  if (!h || !h.json) return null;
  
  const obj = JSON.parse(h.json);
  obj.active = h.active === '1';
  obj.createdAt = Number(h.createdAt || obj.createdAt || Date.now());
  obj.lastTriggeredAt = Number(h.lastTriggeredAt || 0);
  return obj;
}

export async function listAlerts() {
  const ids = await R.smembers(k('alerts:index'));
  if (ids.length === 0) return [];
  
  const pipe = R.multi();
  for (const id of ids) pipe.hgetall(k('alert', id));
  const rows = (await pipe.exec())!.map(r => r[1]) as any[];
  
  return rows.filter(Boolean).map(h => {
    const obj = JSON.parse(h.json);
    obj.active = h.active === '1';
    obj.createdAt = Number(h.createdAt || obj.createdAt || Date.now());
    obj.lastTriggeredAt = Number(h.lastTriggeredAt || 0);
    return obj;
  });
}

export async function removeAlert(id: string) {
  const pipe = R.multi();
  pipe.srem(k('alerts:index'), id);
  pipe.del(k('alert', id));
  pipe.del(k('alert', id, 'events'));
  await pipe.exec();
}

export async function setAlertActive(id: string, active: boolean) {
  await R.hset(k('alert', id), { active: active ? '1' : '0' });
}

export async function updateLastTriggered(id: string, ts: number) {
  await R.hset(k('alert', id), { lastTriggeredAt: String(ts) });
}

export async function pushEvent(id: string, ev: any, limit = 100) {
  const key = k('alert', id, 'events');
  const pipe = R.multi();
  pipe.lpush(key, JSON.stringify(ev));
  pipe.ltrim(key, 0, Math.max(0, limit - 1));
  await pipe.exec();
}

export async function getEvents(id: string, limit = 50) {
  const list = await R.lrange(k('alert', id, 'events'), 0, Math.max(0, limit - 1));
  return list.map(s => JSON.parse(s));
}

export async function connectRedis() {
  if (R.status !== 'ready') await R.connect();
}

