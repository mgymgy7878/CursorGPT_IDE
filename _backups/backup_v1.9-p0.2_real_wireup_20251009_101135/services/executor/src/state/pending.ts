import { readFile, writeFile } from "node:fs/promises";

type Pending = {
	nonce: string;
	action: string;
	params: Record<string, unknown>;
	createdAt: number;
	expiresAt: number;
};

const FILE = process.env.PENDING_FILE || 'logs/pending.copilot.json';
const pendings = new Map<string, Pending>();
let dirty = false;

export function makeNonce(): string {
	const ts = Date.now().toString(36);
	const rnd = Math.random().toString(16).slice(2, 10);
	return `${ts}-${rnd}`;
}

export function putPending(p: Pending) { pendings.set(p.nonce, p); dirty = true; }

export function takePending(nonce: string): Pending | undefined {
	const p = pendings.get(nonce);
	if (!p) return;
	if (Date.now() > p.expiresAt) { pendings.delete(nonce); dirty = true; return; }
	pendings.delete(nonce); dirty = true; return p;
}

export async function loadPendings() {
	try {
		const buf = await readFile(FILE, 'utf8');
		const list: Pending[] = JSON.parse(buf);
		list.forEach(p => { if (p.expiresAt > Date.now()) pendings.set(p.nonce, p); });
	} catch {}
}

export async function flushPendings() {
	if (!dirty) return;
	const list = Array.from(pendings.values());
	await writeFile(FILE, JSON.stringify(list, null, 2)).catch(()=>{});
	dirty = false;
}

setInterval(() => {
	let changed = false;
	for (const [k, v] of pendings) if (Date.now() > v.expiresAt) { pendings.delete(k); changed = true; }
	if (changed) dirty = true;
	flushPendings();
}, 15_000).unref(); 