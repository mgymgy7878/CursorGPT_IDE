import { connectRedis, upsertAlert, getAlert as redisGetAlert, listAlerts as redisListAlerts, removeAlert, setAlertActive, getEvents } from './redis';

export async function initStore() {
  await connectRedis();
}

export async function createAlert(a: any) {
  await upsertAlert(a);
  return a;
}

export async function readAlert(id: string) {
  return await redisGetAlert(id);
}

export async function readAll() {
  return await redisListAlerts();
}

export async function delAlert(id: string) {
  await removeAlert(id);
}

export async function setActive(id: string, active: boolean) {
  await setAlertActive(id, active);
}

export async function history(id: string, limit = 50) {
  return await getEvents(id, limit);
}

export async function countActive() {
  const all = await redisListAlerts();
  return all.filter(a => a.active).length;
}

