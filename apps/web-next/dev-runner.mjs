import { createServer } from 'node:http';
import next from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));          // <-- Uygulama dizini
const PORT = Number(process.env.PORT || 3003);
const HOST = process.env.HOST || '0.0.0.0';

const EVID = path.resolve(DIR, '../../evidence/local/ui');
fs.mkdirSync(EVID, { recursive: true });

function log(name, data) {
  const f = path.join(EVID, `devrunner_${name}.log`);
  fs.writeFileSync(f, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

log('boot', { dir: DIR, host: HOST, port: PORT, node: process.version });

(async () => {
  try {
    const app = next({ dev: true, dir: DIR, hostname: HOST, port: PORT }); // <-- dir sabitlendi
    const handle = app.getRequestHandler();

    await app.prepare();                           // Prepare kanıtı
    log('prepared', { ts: Date.now() });

    createServer((req, res) => handle(req, res))
      .listen(PORT, HOST, () => {
        const msg = `web-next dev listening at http://${HOST}:${PORT}`;
        console.log(msg);
        log('listening', msg);
      });
  } catch (err) {
    console.error('PREPARE_FAILED', err);
    log('prepare_failed', { name: err?.name, message: err?.message, stack: err?.stack });
    process.exit(1);
  }
})();
