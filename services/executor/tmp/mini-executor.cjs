const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const crypto = require('crypto');

const PORT = 4001;

// DEMO pending
const PENDING = new Map([
  ['P1', { key: 'risk.maxNotional', oldVal: 1000, newVal: 800 }],
  ['P2', { key: 'latency.p95.ms',   oldVal: 1200, newVal: 900 }],
]);

const AUDIT_DIR = path.join(process.cwd(), 'evidence', 'guardrails');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit.jsonl');
fs.mkdirSync(AUDIT_DIR, { recursive: true });

const log = (...a) => console.log('[mini-exec]', ...a);

function writeAudit(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFileSync(AUDIT_FILE, line, 'utf8');
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type,x-role,x-actor');
}

function send(res, code, obj) {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj ?? {}));
}

function requireHeaders(req, res, requiredRole) {
  const role  = (req.headers['x-role']  || '').toString().toLowerCase();
  const actor = (req.headers['x-actor'] || '').toString();
  if (!role || !actor) { send(res, 400, { error: 'Missing headers: x-role & X-Actor' }); return null; }
  if (requiredRole === 'admin' && role !== 'admin') { send(res, 403, { error: 'Admin role required' }); return null; }
  return { role, actor };
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      const ct = (req.headers['content-type'] || '').toLowerCase();
      try {
        if (ct.includes('application/json')) return resolve(data ? JSON.parse(data) : {});
        if (ct.includes('application/x-www-form-urlencoded')) return resolve(qs.parse(data));
        try { return resolve(data ? JSON.parse(data) : {}); } catch {}
        return resolve(qs.parse(data));
      } catch { return resolve({}); }
    });
  });
}

function normId(any) {
  return any == null ? null : String(any).trim().toUpperCase(); // P1, P2…
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return send(res, 204, { ok: true });

  const uo = url.parse(req.url, true);
  const method = req.method || 'GET';
  // TRAILING SLASH BUDAMA
  const pathname = (uo.pathname || '/').replace(/\/+$/,'') || '/';

  // DEBUG LOG
  log(method, pathname, { query: uo.query, headers: { 'x-role': req.headers['x-role'], 'x-actor': req.headers['x-actor'] } });

  // Health
  if (pathname === '/health' && method === 'GET') {
    return send(res, 200, { ok: true, service: 'mini-executor' });
  }

  // Allowlist
  if (!pathname.startsWith('/guardrails/params')) {
    return send(res, 404, { error: 'not found' });
  }

  // Pending
  if (pathname === '/guardrails/params/pending' && method === 'GET') {
    const ctx = requireHeaders(req, res, 'viewer'); if (!ctx) return;
    writeAudit({ actor: ctx.actor, role: ctx.role, action: 'view', status: 'success' });
    return send(res, 200, { items: [...PENDING.entries()].map(([id, v]) => ({ id, ...v })) });
  }

  // Approve (POST veya GET ?id=)
  if (pathname === '/guardrails/params/approve' && (method === 'POST' || method === 'GET')) {
    const ctx = requireHeaders(req, res, 'admin'); if (!ctx) return;
    const body = method === 'POST' ? await parseBody(req) : {};
    const id = normId(body?.id ?? body?.ID ?? body?.Id ?? uo.query.id);
    const row = id ? PENDING.get(id) : null;
    if (!row) { writeAudit({ actor: ctx.actor, role: ctx.role, action: 'approve', status: 'failed', message: 'not-found', id }); return send(res, 404, { error: 'not found', got: id }); }
    const diffHash = crypto.createHash('sha1').update(JSON.stringify(row)).digest('hex');
    PENDING.delete(id);
    writeAudit({ actor: ctx.actor, role: ctx.role, action: 'approve', id, diffHash, status: 'success' });
    return send(res, 200, { ok: true, id, diffHash });
  }

  // Deny (POST veya GET ?id=)
  if (pathname === '/guardrails/params/deny' && (method === 'POST' || method === 'GET')) {
    const ctx = requireHeaders(req, res, 'admin'); if (!ctx) return;
    const body = method === 'POST' ? await parseBody(req) : {};
    const id = normId(body?.id ?? body?.ID ?? body?.Id ?? uo.query.id);
    const row = id ? PENDING.get(id) : null;
    if (!row) { writeAudit({ actor: ctx.actor, role: ctx.role, action: 'deny', status: 'failed', message: 'not-found', id }); return send(res, 404, { error: 'not found', got: id }); }
    const diffHash = crypto.createHash('sha1').update(JSON.stringify(row)).digest('hex');
    PENDING.delete(id);
    writeAudit({ actor: ctx.actor, role: ctx.role, action: 'deny', id, diffHash, status: 'success' });
    return send(res, 200, { ok: true, id, diffHash });
  }

  // Audit
  if (pathname === '/guardrails/params/audit' && method === 'GET') {
    const ctx = requireHeaders(req, res, 'admin'); if (!ctx) return;
    return send(res, 200, { info: 'Audit JSONL düşüyor', file: AUDIT_FILE });
  }

  return send(res, 404, { error: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  log('listening on http://127.0.0.1:' + PORT);
});