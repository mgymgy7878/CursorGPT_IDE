import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

type Rec = { id: string; until: number };
const STORE = process.env.OVERRIDE_STORE || 'logs/override.copilot.json';
const map = new Map<string, Rec>();

export async function loadOverrides() {
	try {
		const txt = await readFile(STORE, 'utf8');
		const j = JSON.parse(txt || '{}');
		Object.entries(j as Record<string, Rec>).forEach(([k, v]) => map.set(k, v as Rec));
	} catch {}
}

export async function flushOverrides() {
	try { await mkdir(path.dirname(STORE), { recursive: true }); } catch {}
	const obj: Record<string, Rec> = {};
	for (const [k, v] of map.entries()) obj[k] = v;
	await writeFile(STORE, JSON.stringify(obj, null, 2), 'utf8').catch(()=>{});
}

export function setOverride(user: string, id: string, ttlMs = 600_000) {
	const until = Date.now() + ttlMs;
	map.set(user, { id, until });
}

export function getOverride(user: string): string | undefined {
	const rec = map.get(user);
	if (!rec) return;
	if (Date.now() > rec.until) { map.delete(user); return; }
	return rec.id;
}

export function clearOverride(user: string) { map.delete(user); }

setInterval(() => {
	for (const [k, v] of [...map.entries()]) if (Date.now() > v.until) map.delete(k);
	flushOverrides().catch(()=>{});
}, 30_000); 