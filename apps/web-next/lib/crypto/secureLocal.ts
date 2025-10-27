// Basit AES-GCM sarmalayıcı: passphrase ile türet, localStorage'a şifreli yaz/oku.
// NOT: Üretimde sunucu taraflı KMS/vault tercih edin; bu istemci çözümü geçicidir.
export type SecretName = "binanceApiKey"|"binanceApiSecret"|"openaiApiKey";

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(pass: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pass), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as any, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function setSecret(name: SecretName, value: string, passphrase: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(value)));
  const payload = btoa(String.fromCharCode(...salt, ...iv, ...ct));
  localStorage.setItem(`secret:${name}`, payload);
}

export async function getSecret(name: SecretName, passphrase: string) {
  const payload = localStorage.getItem(`secret:${name}`);
  if (!payload) return null;
  const raw = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
  const salt = raw.slice(0, 16), iv = raw.slice(16, 28), ct = raw.slice(28);
  const key = await deriveKey(passphrase, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(pt);
}

export function clearSecret(name: SecretName){ localStorage.removeItem(`secret:${name}`); }


