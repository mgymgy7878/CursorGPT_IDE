// --- DROP-IN /ai/chat SSE ROUTE (fixed if/else, early-returns) ---
import type { FastifyInstance } from "fastify";
import { runBacktest } from "../services/backtestRunner";
import {
  aiBacktestRunsTotal,
  aiBacktestErrorsTotal,
  aiBacktestMsSummary,
  aiJsonOutTotal,
  aiSseClients,
} from "../metrics/ai";

export default async function aiChatRoutes(f: FastifyInstance) {
  f.get('/ai/chat', async (req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');

    let evId = 0;
    const write = (evt: string, data: string) =>
      reply.raw.write(`id: ${++evId}\nevent: ${evt}\ndata: ${data}\n\n`);

    aiSseClients?.inc?.();
    const beat = setInterval(() => write('ping', 'hb'), 15_000);
    reply.raw.on('close', () => { clearInterval(beat); aiSseClients?.dec?.(); });

    const u = new URL(req.url, 'http://local');
    const prompt = u.searchParams.get('prompt') || '';

    if (!prompt) { write('message', 'missing prompt'); write('done',''); return reply; }

    if (/^\/backtest\.run\b/i.test(prompt)) {
      const params = parseKv(prompt);
      try {
        const t0 = Date.now();
        await runBacktest(params as any, (progress: number) => write('progress', JSON.stringify(progress)));
        aiBacktestRunsTotal.inc();
        aiBacktestMsSummary.observe(Date.now() - t0);
        aiJsonOutTotal.labels('backtest_run' as any).inc();
        write('json', JSON.stringify({ ok:true, tldr:'Backtest complete', params }));
      } catch (err: any) {
        aiBacktestErrorsTotal.inc();
        write('message', `error: ${err?.message || String(err)}`);
      }
      write('done',''); return reply;
    }

    if (/^\/status\b/i.test(prompt)) {
      write('message', 'TL;DR — ok'); write('done',''); return reply;
    }

    write('message', `echo: ${prompt}`); write('done',''); return reply;
  });
}

function parseKv(text: string) {
  const out: Record<string, string|number> = {};
  for (const m of text.matchAll(/\b([a-zA-Z_][\w-]*)=([^\s]+)/g)) {
    const k = m[1]; 
    const v = m[2] ? decodeURIComponent(m[2]) : '';
    const n = Number(v); 
    if (k) {
      out[k] = Number.isFinite(n) ? n : v;
    }
  }
  return out;
}
// --- END DROP-IN --- 