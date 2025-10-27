import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createJob, getJob, setJobState, setJobOutput, setJobError, onJobEvent, offJobEvent, emitJobEvent, cancelJob } from '../lib/jobs.js';
import { jobStore } from '../lib/jobstore.js';
import { aiBacktestRunsTotal, aiBacktestErrorsTotal, aiBacktestMsSummary } from '../metrics/ai.js';
import { runBacktestCore } from '../lib/backtest-core.js';

export default fp(async function backtestRoutes(app: FastifyInstance) {
  app.post('/backtest/jobs', async (req, reply) => {
    const body = (req.body as any) || {};
    const job = createJob('backtest', body);
    setJobState(job.id, 'running');
    const started = Date.now();
    (async () => {
      try {
        const result = await runBacktestCore({
          ...body,
          onEvent: (ev) => emitJobEvent(job.id, ev),
        });
        setJobOutput(job.id, result);
        setJobState(job.id, 'done');
        emitJobEvent(job.id, { event: 'done', result });
        try { aiBacktestRunsTotal.inc(); aiBacktestMsSummary.observe(Date.now()-started); } catch {}
      } catch (e: any) {
        setJobError(job.id, { message: e?.message || 'backtest_failed' });
        emitJobEvent(job.id, { event: 'error', message: e?.message || 'backtest_failed' });
        try { aiBacktestErrorsTotal.inc(); } catch {}
      }
    })();
    return reply.send({ ok: true, jobId: job.id, state: 'running' });
  });

  app.get('/backtest/jobs/:jobId', async (req, reply) => {
    const { jobId } = req.params as any;
    const j = getJob(jobId) || (await jobStore.get(jobId));
    if (!j) return reply.code(404).send({ ok: false, error: 'job_not_found' });
    return reply.send({ ok: true, id: j.id, state: (j as any).state, updatedAt: (j as any).updatedAt });
  });

  app.get('/backtest/stream/:jobId', async (req, reply) => {
    const { jobId } = req.params as any;
    const job = getJob(jobId);
    if (!job) return reply.code(404).send({ ok: false, error: 'job_not_found' });
    (reply.raw as any).writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const handler = (ev: any) => (reply.raw as any).write(`data: ${JSON.stringify(ev)}\n\n`);
    onJobEvent(jobId, handler);
    (reply.raw as any).write(`data: ${JSON.stringify({ event: 'attached', state: job.state })}\n\n`);
    // Heartbeat
    const hb = setInterval(() => {
      try { (reply.raw as any).write(`:hb\n\n`); } catch {}
    }, 15000);
    (req.raw as any).on('close', () => offJobEvent(jobId, handler));
    (req.raw as any).on('close', () => clearInterval(hb));
  });

  app.delete('/backtest/jobs/:jobId', async (req, reply) => {
    const { jobId } = req.params as any;
    const ok = cancelJob(jobId);
    return reply.send({ ok });
  });

  // Export equity/trades/metrics as CSV/JSON (basic mock export)
  app.get('/backtest/export/:jobId', async (req, reply) => {
    const { jobId } = req.params as any;
    const fmt = ((req.query as any)?.fmt || 'json').toString();
    const j = getJob(jobId) || (await jobStore.get(jobId));
    if (!j || !(j as any).output) return reply.code(404).send({ ok: false, error: 'job_not_found_or_no_output' });
    const out = (j as any).output || {};
    if (fmt === 'csv') {
      const rows: Array<{ t:number; v:number }> = (out.equity || []).map((p:[number,number])=>({ t:p[0], v:p[1] }));
      const header = 't,v\n';
      const body = rows.map(r=>`${r.t},${r.v}`).join('\n');
      reply.header('Content-Type','text/csv');
      reply.send(header+body);
    } else {
      reply.header('Content-Type','application/json');
      reply.send(out);
    }
  });
});


