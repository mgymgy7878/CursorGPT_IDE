import { spawn } from 'node:child_process';
import { mkdirSync, createWriteStream } from 'node:fs';
import { join } from 'node:path';

const LOG_DIR = join(process.cwd(), 'evidence', 'local', 'dev');
mkdirSync(LOG_DIR, { recursive: true });

const IS_WIN = process.platform === 'win32';

function run(name, cmd, args, cwd, extraEnv = {}) {
  const out = createWriteStream(join(LOG_DIR, `${name}.log`), { flags: 'a' });
  const env = {
    ...process.env,
    EXECUTOR_ORIGIN: process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001',
    BINANCE_FUTURES_BASE_URL: process.env.BINANCE_FUTURES_BASE_URL || 'https://testnet.binancefuture.com',
    BINANCE_FUTURES_PREFIX: process.env.BINANCE_FUTURES_PREFIX || '/fapi/v1',
    ...extraEnv,
  };
  const realCmd = IS_WIN ? 'cmd' : cmd;
  const realArgs = IS_WIN ? ['/c', cmd, ...args] : args;
  const p = spawn(realCmd, realArgs, { cwd, env, shell: false });
  const pipe = (s, tag) => s.on('data', d => {
    const line = `[${new Date().toISOString()}] [${tag}] ${d}`;
    process.stdout.write(line);
    out.write(line);
  });
  pipe(p.stdout, name);
  pipe(p.stderr, name);
  p.on('exit', (code) => {
    const msg = `[${new Date().toISOString()}] [${name}] EXIT ${code}\n`;
    process.stdout.write(msg);
    out.write(msg);
  });
  return p;
}

const execBase = join(process.cwd(), 'services', 'executor');
const webBase  = join(process.cwd(), 'apps', 'web-next');

run('executor', 'pnpm', ['--filter', 'executor', 'dev'], execBase);
setTimeout(() => run('web-next', 'pnpm', ['--filter', 'web-next', 'dev'], webBase), 1500);

console.log(`[dev-runner] logs -> ${LOG_DIR}`);
