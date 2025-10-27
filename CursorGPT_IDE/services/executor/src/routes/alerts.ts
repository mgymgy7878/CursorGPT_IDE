import type { FastifyInstance, FastifyRequest } from 'fastify';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

type CreateAlertBody = {
  name: string;                 // ör: "ui-5xx-error-rate"
  query: string;                // ör: rate(http_requests_total{app="web-next",status=~"5.."}[5m])
  threshold: number;            // ör: 0.02
  comparison: '>' | '>=' | '<' | '<=';
  for?: string;                 // ör: "3m"
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  group?: string;               // opsiyonel: kural grubu adı
};

export default async function alertsRoutes(app: FastifyInstance) {
  // API Key authentication helper
  function checkApiKey(req: FastifyRequest, reply: any) {
    const apiKey = process.env.ALERTS_API_KEY;
    if (!apiKey) return; // No key configured, skip auth
    const providedKey = req.headers['x-alerts-key'] as string;
    if (providedKey !== apiKey) {
      return reply.code(401).send({ ok: false, error: 'Invalid or missing X-Alerts-Key header' });
    }
  }

  app.post('/alerts/create', async (req: FastifyRequest<{ Body: CreateAlertBody }>, reply) => {
    const authError = checkApiKey(req, reply);
    if (authError) return authError;
    const body = req.body;
    if (!body?.name || !body?.query || !body?.comparison || typeof body?.threshold !== 'number') {
      return reply.code(400).send({ ok: false, error: 'Invalid body: name, query, comparison, threshold required' });
    }

    const groupName = body.group || 'spark-dynamic';
    const forDur = body.for || '3m';
    const expr = `${body.query} ${body.comparison} ${body.threshold}`;

    const labels = { severity: 'warning', source: 'spark', ...(body.labels || {}) };
    const annotations = {
      summary: body.name,
      description: `Auto-generated alert: ${expr}`,
      ...(body.annotations || {})
    };

    // Basit, bağımsız bir rule file yaz (Prometheus file-based rules)
    const RULES_DIR = process.env.PROM_RULES_DIR || path.resolve(process.cwd(), 'prometheus', 'rules.d');
    const fnameSafe = body.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filepath = path.join(RULES_DIR, `dyn_${Date.now()}_${fnameSafe}.yml`);

    const yaml = [
      'groups:',
      `- name: ${groupName}`,
      '  rules:',
      `  - alert: ${body.name}`,
      `    expr: ${JSON.stringify(expr)}`,         // expr içinde ":" vs. güvenli
      `    for: ${forDur}`,
      '    labels:'
    ].concat(
      Object.entries(labels).map(([k, v]) => `      ${k}: ${JSON.stringify(v)}`)
    ).concat([
      '    annotations:'
    ]).concat(
      Object.entries(annotations).map(([k, v]) => `      ${k}: ${JSON.stringify(v)}`)
    ).join('\n') + '\n';

    await mkdir(RULES_DIR, { recursive: true });
    await writeFile(filepath, yaml, 'utf8');

    // Prometheus reload
    const reloadURL = process.env.PROM_RELOAD_URL || 'http://127.0.0.1:9090/-/reload';
    let reload = { ok: false, status: 0 };
    try {
      const r = await fetch(reloadURL, { method: 'POST' });
      reload = { ok: r.ok, status: r.status };
    } catch (_) { /* offline ise 202 döneceğiz */ }

    return reply.code(reload.ok ? 200 : 202).send({
      ok: true,
      file: filepath,
      group: groupName,
      reload
    });
  });

  // List dynamic alert files
  app.get('/alerts/list', async (req, reply) => {
    const authError = checkApiKey(req, reply);
    if (authError) return authError;
    
    try {
      const RULES_DIR = process.env.PROM_RULES_DIR || path.resolve(process.cwd(), 'prometheus', 'rules.d');
      const files = await import('fs/promises').then(fs => fs.readdir(RULES_DIR));
      const dynFiles = files.filter(f => f.startsWith('dyn_') && f.endsWith('.yml'));
      return reply.send({ ok: true, files: dynFiles });
    } catch (err: any) {
      return reply.code(500).send({ ok: false, error: err.message });
    }
  });

  // Delete specific alert file
  app.delete('/alerts/:file', async (req: FastifyRequest<{ Params: { file: string } }>, reply) => {
    const authError = checkApiKey(req, reply);
    if (authError) return authError;
    
    const { file } = req.params;
    if (!file.startsWith('dyn_') || !file.endsWith('.yml')) {
      return reply.code(400).send({ ok: false, error: 'Invalid file name - must be dyn_*.yml' });
    }
    
    try {
      const RULES_DIR = process.env.PROM_RULES_DIR || path.resolve(process.cwd(), 'prometheus', 'rules.d');
      const filepath = path.join(RULES_DIR, file);
      await import('fs/promises').then(fs => fs.unlink(filepath));
      
      // Prometheus reload
      const reloadURL = process.env.PROM_RELOAD_URL || 'http://127.0.0.1:9090/-/reload';
      let reload = { ok: false, status: 0 };
      try {
        const r = await fetch(reloadURL, { method: 'POST' });
        reload = { ok: r.ok, status: r.status };
      } catch (_) { /* offline ise 202 döneceğiz */ }
      
      return reply.send({ ok: true, deleted: file, reload });
    } catch (err: any) {
      return reply.code(500).send({ ok: false, error: err.message });
    }
  });

  // Garbage collect old alert files
  app.post('/alerts/gc', async (req: FastifyRequest<{ Body: { ttlDays?: number } }>, reply) => {
    const authError = checkApiKey(req, reply);
    if (authError) return authError;
    
    const ttlDays = req.body?.ttlDays || 30;
    const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - ttlMs;
    
    try {
      const RULES_DIR = process.env.PROM_RULES_DIR || path.resolve(process.cwd(), 'prometheus', 'rules.d');
      const fs = await import('fs/promises');
      const files = await fs.readdir(RULES_DIR);
      const dynFiles = files.filter(f => f.startsWith('dyn_') && f.endsWith('.yml'));
      
      const deletedFiles = [];
      for (const file of dynFiles) {
        const filepath = path.join(RULES_DIR, file);
        const stats = await fs.stat(filepath);
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filepath);
          deletedFiles.push(file);
        }
      }
      
      // Prometheus reload if any files were deleted
      let reload = { ok: false, status: 0 };
      if (deletedFiles.length > 0) {
        const reloadURL = process.env.PROM_RELOAD_URL || 'http://127.0.0.1:9090/-/reload';
        try {
          const r = await fetch(reloadURL, { method: 'POST' });
          reload = { ok: r.ok, status: r.status };
        } catch (_) { /* offline ise 202 döneceğiz */ }
      }
      
      return reply.send({ ok: true, deleted: deletedFiles, count: deletedFiles.length, reload });
    } catch (err: any) {
      return reply.code(500).send({ ok: false, error: err.message });
    }
  });
}
