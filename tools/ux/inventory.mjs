#!/usr/bin/env node
/*
  UX Inventory Tool (ESM)
  - Discovers app routes (app router), nav links, API usage, i18n keys
  - Optionally probes dev server at 127.0.0.1:3003
  - Outputs docs/reports/UX_INVENTORY.md
*/
import { promises as fs } from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const webRoot = path.join(repoRoot, 'apps', 'web-next');
const appDir = path.join(webRoot, 'src', 'app');
const reportDir = path.join(repoRoot, 'docs', 'reports');
const reportFile = path.join(reportDir, 'UX_INVENTORY.md');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

async function walk(dir, filter = () => true) {
  const out = [];
  async function rec(d) {
    let entries = [];
    try { entries = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await rec(full);
      else if (filter(full)) out.push(full);
    }
  }
  await rec(dir);
  return out;
}

function pathToRoute(p) {
  // p: .../src/app/.../page.tsx → /...
  const rel = path.relative(appDir, p).replace(/\\/g, '/');
  if (!rel.endsWith('/page.tsx')) return null;
  const r = '/' + rel.replace(/\/page\.tsx$/, '');
  return r === '/page' ? '/' : r;
}

async function discoverRoutes() {
  const pages = await walk(appDir, (f) => /\/page\.tsx$/.test(f));
  return pages.map(pathToRoute).filter(Boolean).sort();
}

async function readFileSafe(p) {
  try { return await fs.readFile(p, 'utf8'); } catch { return ''; }
}

async function discoverNav() {
  const appShell = await readFileSafe(path.join(webRoot, 'src', 'components', 'layout', 'AppShell.tsx'));
  const shell = await readFileSafe(path.join(webRoot, 'src', 'components', 'layout', 'Shell.tsx'));
  const hrefRe = /href\s*=\s*["']([^"']+)["']/g;
  const items = new Set();
  for (const src of [appShell, shell]) {
    let m; while ((m = hrefRe.exec(src))) {
      const h = m[1];
      if (h.startsWith('/')) items.add(h);
    }
  }
  return Array.from(items).sort();
}

async function discoverApis() {
  const routeFiles = await walk(path.join(appDir, 'api'), (f) => /\/route\.ts$/.test(f));
  const apiRoutes = routeFiles.map((f) => '/api/' + path.relative(path.join(appDir, 'api'), path.dirname(f)).replace(/\\/g, '/'));
  const codeFiles = await walk(path.join(webRoot, 'src'), (f) => /\.(ts|tsx)$/.test(f));
  const used = new Set();
  const fetchRe = /fetch\(([`'"])(\/api\/[^\1]+?)\1/g;
  for (const f of codeFiles) {
    const src = await readFileSafe(f);
    let m; while ((m = fetchRe.exec(src))) used.add(m[2]);
  }
  const mark = (p) => /\bmock\b/i.test(p) || /\/public\/.+mock/i.test(p) ? 'MOCK' : 'REAL';
  const routes = apiRoutes.sort().map((r) => ({ route: r, type: mark(r), used: used.has(r) }));
  const unused = routes.filter(r => !r.used).map(r => r.route);
  const usedOnly = Array.from(used).filter(u => !apiRoutes.includes(u));
  return { routes, unused, usedOnly };
}

async function discoverI18nKeys() {
  const codeFiles = await walk(path.join(webRoot, 'src'), (f) => /\.(ts|tsx)$/.test(f));
  const keyRe = /\bnav\.[a-zA-Z0-9_.-]+|\baudit\.[a-zA-Z0-9_.-]+/g;
  const keys = new Set();
  for (const f of codeFiles) {
    const src = await readFileSafe(f);
    let m; while ((m = keyRe.exec(src))) keys.add(m[0]);
  }
  // try read locales
  const enPath = path.join(webRoot, 'src', 'i18n', 'locales', 'en.json');
  const trPath = path.join(webRoot, 'src', 'i18n', 'locales', 'tr.json');
  let en = {}; let tr = {};
  try { en = JSON.parse(await readFileSafe(enPath) || '{}'); } catch {}
  try { tr = JSON.parse(await readFileSafe(trPath) || '{}'); } catch {}
  const existing = new Set();
  const flatten = (obj, prefix = '') => {
    for (const [k, v] of Object.entries(obj || {})) {
      if (v && typeof v === 'object') flatten(v, prefix ? `${prefix}.${k}` : k);
      else existing.add(prefix ? `${prefix}.${k}` : k);
    }
  };
  flatten(en); flatten(tr);
  const missing = Array.from(keys).filter(k => !existing.has(k));
  return { keys: Array.from(keys).sort(), missing: missing.sort() };
}

async function httpProbe(paths) {
  const base = 'http://127.0.0.1:3003';
  const out = [];
  try {
    const r = await fetch(base);
    out.push({ path: '/', status: r.status });
  } catch {
    return { up: false, results: [] };
  }
  for (const p of paths) {
    if (p === '/') continue;
    try {
      const r = await fetch(base + p, { redirect: 'manual' });
      out.push({ path: p, status: r.status });
    } catch {
      out.push({ path: p, status: 'ERR' });
    }
  }
  return { up: true, results: out };
}

function mdTable(rows, headers) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(r => `| ${headers.map(h => String(r[h] ?? '')).join(' | ')} |`).join('\n');
  return [head, sep, body].join('\n');
}

async function main() {
  await ensureDir(reportDir);

  const routes = await discoverRoutes();
  const nav = await discoverNav();
  const api = await discoverApis();
  const i18n = await discoverI18nKeys();

  const probeTargets = ['/', '/dashboard', '/portfolio', '/strategy-lab', '/strategy-lab-copilot', '/strategies', '/audit', '/observability', '/settings', '/news', '/macro'];
  const probe = await httpProbe(probeTargets);

  const routeRows = routes.map(r => ({ path: r, inNav: nav.includes(r) ? 'YES' : 'NO' }));
  const apiRows = api.routes.map(x => ({ route: x.route, type: x.type, used: x.used ? 'YES' : 'NO' }));
  const probeRows = probe.results.map(x => ({ path: x.path, status: x.status }));

  const md = [];
  md.push('# UX Inventory');
  md.push('');
  md.push('## Routes');
  md.push(mdTable(routeRows, ['path', 'inNav']));
  md.push('');
  md.push('## Nav Items');
  md.push(nav.map(x => `- ${x}`).join('\n'));
  md.push('');
  md.push('## API Routes (MOCK/REAL & usage)');
  md.push(mdTable(apiRows, ['route', 'type', 'used']));
  md.push('');
  md.push('### Unused API');
  md.push(api.unused.map(x => `- ${x}`).join('\n') || '- none');
  md.push('');
  md.push('### Used but not implemented');
  md.push(api.usedOnly.map(x => `- ${x}`).join('\n') || '- none');
  md.push('');
  md.push('## i18n Keys (detected)');
  md.push(i18n.keys.map(x => `- ${x}`).join('\n') || '- none');
  md.push('');
  md.push('### Missing i18n');
  md.push(i18n.missing.map(x => `- ${x}`).join('\n') || '- none');
  md.push('');
  md.push('## HTTP Probe');
  md.push(`Server up: ${probe.up ? 'YES' : 'NO'}`);
  if (probe.up) {
    md.push(mdTable(probeRows, ['path', 'status']));
  }

  await fs.writeFile(reportFile, md.join('\n'), 'utf8');
  console.log('Wrote', reportFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


