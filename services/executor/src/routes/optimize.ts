import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createJob, getJob, setJobState, setJobOutput, setJobError, onJobEvent, offJobEvent, emitJobEvent, cancelJob } from '../lib/jobs.js';
import { jobStore } from '../lib/jobstore.js';

async function runOptimizeMock(input: any, onEvent: (ev: any) => void) {
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, 120));
    onEvent({ event: 'progress', step: i, of: steps });
    if (i % 4 === 0) onEvent({ event: 'candidate', params: { fast: 9 + i, slow: 21 + i * 2 }, score: Math.random() });
  }
  return { best: { params: { fast: 13, slow: 34 }, score: 0.71 } };
}

export default fp(async function optimizeRoutes(app: FastifyInstance) {
  app.post('/optimize/jobs', async (req, reply) => {
    const body = (req.body as any) || {};
    const job = createJob('optimize', body);
    setJobState(job.id, 'running');
    const started = Date.now();
    (async () => {
      try {
        const result = await runOptimizeMock(body, (ev) => emitJobEvent(job.id, ev));
        setJobOutput(job.id, result);
        setJobState(job.id, 'done');
        emitJobEvent(job.id, { event: 'done', result });
        try { const dt = Date.now()-started; (await import('../metrics/ai.js')).aiBacktestMsSummary.observe(dt); } catch {}
      } catch (e: any) {
        setJobError(job.id, { message: e?.message || 'optimize_failed' });
        emitJobEvent(job.id, { event: 'error', message: e?.message || 'optimize_failed' });
      }
    })();
    return reply.send({ ok: true, jobId: job.id, state: 'running' });
  });

  app.get('/optimize/jobs/:jobId', async (req, reply) => {
    const { jobId } = req.params as any;
    const j = getJob(jobId) || (await jobStore.get(jobId));
    if (!j) return reply.code(404).send({ ok: false, error: 'job_not_found' });
    return reply.send({ ok: true, id: j.id, state: (j as any).state, updatedAt: (j as any).updatedAt });
  });

  app.get('/optimize/stream/:jobId', async (req, reply) => {
    const { jobId } = req.params as any;
    const job = getJob(jobId);
    if (!job) return reply.code(404).send({ ok: false, error: 'job_not_found' });
    (reply.raw as any).writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const handler = (ev: any) => (reply.raw as any).write(`data: ${JSON.stringify(ev)}\n\n`);
    onJobEvent(jobId, handler);
    (reply.raw as any).write(`data: ${JSON.stringify({ event: 'attached', state: job.state })}\n\n`);
    const hb = setInterval(() => { try { (reply.raw as any).write(`:hb\n\n`); } catch {} }, 15000);
    (req.raw as any).on('close', () => offJobEvent(jobId, handler));
    (req.raw as any).on('close', () => clearInterval(hb));
  });

  app.delete('/optimize/jobs/:jobId', async (req, reply) => {
    const { jobId } = req.params as any;
    const ok = cancelJob(jobId);
    return reply.send({ ok });
  });
});


