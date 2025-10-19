// tools/hardlock_probe.mjs
// Node 18+: global fetch mevcut. Tek SUMMARY basar.
// Kullanım:
//   node tools/hardlock_probe.mjs probe --e2e    (3004 probe + E2E, 3005 CSP)
//   node tools/hardlock_probe.mjs probe          (yalnız probe + CSP)
//   PORT varsayılanları: 3004 (probe), 3005 (csp)

import { execSync } from 'node:child_process';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hasArg = (k) => process.argv.includes(k);
const summary = [];

// roles:["user"], exp 2030+
const JWT_USER =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlcyI6WyJ1c2VyIl0sImV4cCI6MTg5MzQ1NjAwMH0.';

async function get(url, opts = {}) {
  const res = await fetch(url, { redirect: 'manual', ...opts });
  const headers = Object.fromEntries([...res.headers.entries()]);
  const body = await res.text().catch(() => '');
  return { status: res.status, headers, body };
}

async function probe3004() {
  // Health(UI)
  try {
    const h = await get('http://localhost:3004/api/healthz?mode=ui');
    if (h.status !== 200) summary.push(`WARN=health_ui ${h.status}`);
  } catch {
    summary.push('WARN=health_ui unreachable');
  }

  // PROBE1 — cookie yok → /strategies (307 /login)
  const p1 = await get('http://localhost:3004/strategies');
  summary.push(
    `PROBE1=/strategies code=${p1.status} loc=${p1.headers.location || ''} guard=${p1.headers['x-ux-guard'] || ''} path=${p1.headers['x-ux-path'] || ''} token=${p1.headers['x-ux-token'] || ''}`
  );

  // PROBE2 — user JWT cookie → /strategies (200)
  const cookie = `spark_session=${JWT_USER}; auth=${JWT_USER}`;
  const p2 = await get('http://localhost:3004/strategies', {
    headers: { cookie },
  });
  summary.push(
    `PROBE2=/strategies code=${p2.status} guard=${p2.headers['x-ux-guard'] || ''} roles=${p2.headers['x-ux-roles'] || ''}`
  );

  // PROBE3 — user JWT → /reports/verify (403 veya 3xx)
  const p3 = await get('http://localhost:3004/reports/verify', {
    headers: { cookie },
  });
  summary.push(
    `PROBE3=/reports/verify code=${p3.status} loc=${p3.headers.location || ''} guard=${p3.headers['x-ux-guard'] || ''} roles=${p3.headers['x-ux-roles'] || ''}`
  );
}

async function csp3005() {
  const r = await get('http://localhost:3005/strategies');
  const dash = await get('http://localhost:3005/dashboard');
  const csp = !!r.headers['content-security-policy'];
  const ro = !!r.headers['content-security-policy-report-only'];
  summary.push(`CSP_ENFORCE csp=${csp} ro=${ro} dash=${dash.status}`);
  return { csp, ro, dashOK: dash.status === 200 };
}

function runE2E() {
  try {
    execSync('pnpm --filter web-next exec playwright install --with-deps', {
      stdio: 'inherit',
    });
  } catch {}
  let out = '';
  try {
    out = execSync('pnpm --filter web-next test:e2e', { encoding: 'utf8' });
  } catch (e) {
    out = (e.stdout?.toString?.() || e.message || '').trim();
  }
  summary.push(
    `E2E_RESULT=${out.replace(/\r/g, ' ').replace(/\n/g, ' ').trim()}`
  );
  return / 0 failed\b/.test(out) || (/passed/i.test(out) && !/failed/i.test(out));
}

async function main() {
  await probe3004();

  let e2eOK = true;
  if (hasArg('--e2e')) {
    e2eOK = runE2E();
  } else {
    summary.push('E2E_RESULT=skipped');
  }

  const { csp, ro, dashOK } = await csp3005();
  const green = e2eOK && csp && !ro && dashOK;
  summary.unshift(`STATUS=${green ? 'GREEN' : 'AMBER'}`);
  console.log(summary.join('\n'));
}

await main();


