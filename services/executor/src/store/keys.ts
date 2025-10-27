import fs from 'fs';
import path from 'path';
import { open, seal, IN_MEMORY_ONLY } from "../crypto/secure.js";

type KeyRec = { exchange: string; env: 'testnet'|'live'; apiKey: string; apiSecretSealed: string };

const mem = new Map<string, KeyRec>();
const file = path.join(process.cwd(), 'secrets.binance.json');

export function setKey(id: string, rec: { exchange: string; env: 'testnet'|'live'; apiKey: string; apiSecret: string }) {
  const sealed = seal(rec.apiSecret);
  const row: KeyRec = { exchange: rec.exchange, env: rec.env, apiKey: rec.apiKey, apiSecretSealed: sealed };
  mem.set(id, row);
  if (!IN_MEMORY_ONLY) fs.writeFileSync(file, JSON.stringify(Object.fromEntries(mem)), 'utf8');
}

export function loadAll() {
  if (IN_MEMORY_ONLY) return;
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const obj = JSON.parse(raw);
    for (const [k,v] of Object.entries<any>(obj)) mem.set(k, v);
  } catch {}
}

export function getKey(id: string): { exchange: string; env: 'testnet'|'live'; apiKey: string; apiSecret: string } | null {
  const row = mem.get(id);
  if (!row) return null;
  return { exchange: row.exchange, env: row.env, apiKey: row.apiKey, apiSecret: open(row.apiSecretSealed) };
}
