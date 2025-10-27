import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

type VaultData = Record<string, string>;
const VAULT_PATH = resolve(process.cwd(), ".secure/vault.enc");

function keyBytes(): Buffer | null {
  const raw = process.env.SETTINGS_MASTER_KEY || "";
  if (!raw) return null;
  // raw base64 veya hex olabilir; değilse utf8 truncate
  try { return Buffer.from(raw, "base64"); } catch {}
  try { return Buffer.from(raw, "hex"); } catch {}
  return Buffer.from(raw.padEnd(32, "0").slice(0,32), "utf8");
}

let memoryVault: VaultData = {}; // fallback

export function listMasked(): Record<string, string> {
  const data = load();
  return Object.fromEntries(Object.entries(data).map(([k,v]) => [k, mask(v)]));
}

export function setKey(name: string, value: string) {
  const data = load();
  data[name] = value;
  save(data);
}

export function delKey(name: string) {
  const data = load();
  delete data[name];
  save(data);
}

export function getRaw(name: string): string | undefined {
  const data = load();
  return data[name];
}

function mask(v: string) {
  if (!v) return "";
  if (v.length <= 4) return "***";
  return v.slice(0,2) + "***" + v.slice(-2);
}

function load(): VaultData {
  const kb = keyBytes();
  if (!kb) return memoryVault;
  if (!existsSync(VAULT_PATH)) return {};
  const enc = readFileSync(VAULT_PATH);
  const iv = enc.subarray(0, 12);
  const tag = enc.subarray(12, 28);
  const data = enc.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", kb, iv);
  decipher.setAuthTag(tag);
  const json = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return JSON.parse(json || "{}");
}

function save(data: VaultData) {
  const kb = keyBytes();
  if (!kb) { memoryVault = data; return; }
  mkdirSync(dirname(VAULT_PATH), { recursive: true });
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", kb, iv);
  const json = Buffer.from(JSON.stringify(data), "utf8");
  const enc = Buffer.concat([cipher.update(json), cipher.final()]);
  const tag = cipher.getAuthTag();
  const out = Buffer.concat([iv, tag, enc]);
  writeFileSync(VAULT_PATH, out);
} 