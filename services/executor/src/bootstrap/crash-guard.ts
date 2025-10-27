/* Minimal crash telemetry to evidence/local/executor/crash-*.log */
import fs from 'node:fs';
import path from 'node:path';

const EVIDENCE_DIR = path.resolve(process.cwd(), '../../evidence/local/executor');
const CRASH_DIR = path.join(EVIDENCE_DIR, 'crash');
try { fs.mkdirSync(CRASH_DIR, { recursive: true }); } catch {}

function write(name: string, data: unknown) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(CRASH_DIR, `${ts}.${name}.log`);
  try {
    fs.writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } catch {}
}

process.on('beforeExit', (code) => {
  write('beforeExit', { code, now: Date.now() });
});
process.on('exit', (code) => {
  write('exit', { code, now: Date.now(), note: 'process exit triggered' });
});
process.on('uncaughtException', (err) => {
  write('uncaughtException', { name: err?.name, message: err?.message, stack: err?.stack });
  // hard-fail to preserve state
  process.exit(1);
});
process.on('unhandledRejection', (reason: unknown) => {
  write('unhandledRejection', { reason: (reason as any)?.stack ?? String(reason) });
  process.exit(1);
});
process.on('warning', (w) => {
  write('warning', { name: w.name, message: w.message, stack: w.stack });
});

export function installCrashGuard() {
  // noop: module import side-effects are enough
}
