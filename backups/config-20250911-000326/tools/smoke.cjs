const fs = require('fs');
const { setTimeout: sleep } = require('timers/promises');

const UI = process.env.UI_PING || 'http://127.0.0.1:3003/api/public/ping';
const API = process.env.API_HEALTH || 'http://127.0.0.1:4001/health';
const TIMEOUT = Number(process.env.SMOKE_TIMEOUT_MS || 4000);

async function ping(url) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return { ok: r.ok, status: r.status, url };
  } catch (e) {
    return { ok: false, status: 0, url, error: String(e?.message || e) };
  } finally {
    clearTimeout(id);
  }
}

async function retryPing(url, attempts = 10, sleepCapMs = 2500) {
  for (let i = 1; i <= attempts; i++) {
    const res = await ping(url);
    if (res.ok) return { ...res, attempt: i };
    await sleep(Math.min(500 * i, sleepCapMs));
  }
  const last = await ping(url);
  return { ...last, attempt: attempts };
}

function parseFlags(argv) {
  const opts = { all: false, ui: false, api: false, retries: 10, sleep: 2500 };
  for (let i = 0; i < argv.length; i++) {
    const a = String(argv[i]).toLowerCase();
    if (a === '--all' || a === 'all') opts.all = true;
    else if (a === '--ui' || a === 'ui') opts.ui = true;
    else if (a === '--api' || a === 'api') opts.api = true;
    else if (a === '--retries') { const n = Number(argv[++i]); if (!Number.isNaN(n) && n > 0) opts.retries = n; }
    else if (a === '--sleep') { const n = Number(argv[++i]); if (!Number.isNaN(n) && n > 0) opts.sleep = n; }
  }
  if (!opts.all && !opts.ui && !opts.api) opts.all = true;
  return opts;
}

async function main() {
  const opts = parseFlags(process.argv.slice(2));
  const runUI  = opts.all || opts.ui;
  const runAPI = opts.all || opts.api;

  const outDir = 'evidence/analysis';
  fs.mkdirSync(outDir, { recursive: true });

  const res = {};
  if (runUI)  res.ui  = await retryPing(UI, opts.retries, opts.sleep);
  if (runAPI) res.api = await retryPing(API, opts.retries, opts.sleep);

  fs.writeFileSync(`${outDir}/smoke_summary.json`, JSON.stringify(res, null, 2));
  if (res.ui)  fs.writeFileSync(`${outDir}/smoke_ui.json`,  JSON.stringify(res.ui,  null, 2));
  if (res.api) fs.writeFileSync(`${outDir}/smoke_api.json`, JSON.stringify(res.api, null, 2));

  const ok = (!runUI  || res.ui.ok) && (!runAPI || res.api.ok);
  console.log(JSON.stringify(res, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
