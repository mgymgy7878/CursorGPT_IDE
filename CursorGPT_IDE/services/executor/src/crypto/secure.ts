import crypto from 'crypto';

const MASTER = process.env.ALGO_SECRETS_MASTER_KEY || '';
const IN_MEMORY_ONLY = process.env.IN_MEMORY_ONLY === 'true';

export function seal(plain: string) {
  if (!MASTER) return Buffer.from(plain, 'utf8').toString('base64');
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(MASTER).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function open(sealed: string) {
  if (!MASTER) return Buffer.from(sealed, 'base64').toString('utf8');
  const raw = Buffer.from(sealed, 'base64');
  const iv = raw.subarray(0,12);
  const tag = raw.subarray(12,28);
  const enc = raw.subarray(28);
  const key = crypto.createHash('sha256').update(MASTER).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

export { IN_MEMORY_ONLY };
