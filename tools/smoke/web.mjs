#!/usr/bin/env node
const base = 'http://127.0.0.1:3003';
const routes = ['/', '/portfolio', '/copilot-home', '/correlation', '/signals', '/macro', '/news', '/strategy-lab-copilot', '/backtest', '/strategies', '/audit'];

async function probe(p) {
  try {
    const r = await fetch(base + p, { redirect: 'manual' });
    return r.status;
  } catch { return 'ERR'; }
}

(async () => {
  try {
    const r = await fetch(base);
    if (!r.ok) throw new Error('base not ok');
  } catch {
    console.log('DEV server not running, skipping web smoke');
    process.exit(0);
  }
  const out = [];
  for (const p of routes) {
    const s = await probe(p);
    out.push({ path: p, status: s });
  }
  console.table(out);
  process.exit(0);
})();


