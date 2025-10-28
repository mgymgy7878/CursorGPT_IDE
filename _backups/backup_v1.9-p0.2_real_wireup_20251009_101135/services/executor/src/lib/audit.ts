import { appendFile } from 'node:fs/promises';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const AUDIT_DIR = join(process.cwd(), 'evidence', 'guardrails');
const AUDIT_FILE = join(AUDIT_DIR, 'audit.jsonl');

if (!existsSync(AUDIT_DIR)) {
  mkdirSync(AUDIT_DIR, { recursive: true });
}

export async function auditLog(entry: {
  actor: string;
  role: string;
  action: 'approve'|'deny'|'view';
  id?: string;
  diffHash?: string;
  status: 'success'|'failed';
  message?: string;
}) {
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    await appendFile(AUDIT_FILE, line, 'utf8');
    
    // Prod hardening: fsync for data integrity
    const fs = await import('node:fs');
    const fd = fs.openSync(AUDIT_FILE, 'r+');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
  } catch (error) {
    // Critical: Audit yazım hatası → log + alert
    console.error('[AUDIT_ERROR]', { error: error.message, entry });
    // TODO: Prometheus counter: audit_write_errors_total
  }
}