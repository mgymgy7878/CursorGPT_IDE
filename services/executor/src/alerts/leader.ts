import { R } from './redis';

const NS = process.env.REDIS_NAMESPACE || 'spark:alerts';
const KEY = `${NS}:scheduler:lock`;
const ID = process.env.SCHEDULER_ID || `pid:${process.pid}`;
const TTL = Math.max(parseInt(process.env.SCHEDULER_LEASE_SEC || '35', 10), 10);

export async function tryAcquire(): Promise<boolean> {
  const res = await R.set(KEY, ID, 'EX', TTL, 'NX');
  return res === 'OK';
}

export async function heartbeat(): Promise<void> {
  // Renew if still leader; extend TTL
  await R.expire(KEY, TTL);
}

export async function whoIsLeader(): Promise<string | null> {
  return await R.get(KEY);
}

