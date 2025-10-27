import type { NextApiRequest, NextApiResponse } from "next";
import { getSupervisor } from "../../../server/supervisor";
import { optimizeHub } from "../../../server/optimizeHub";
import { walkforwardHub } from "../../../server/walkforwardHub";
import { requireJWTOrApiKey } from "../_mwAuth";

export const config = { api: { bodyParser: false } };

function write(res: NextApiResponse, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res).ok) return;
  res.writeHead(200, {
    'Content-Type':'text/event-stream', 'Cache-Control':'no-cache, no-transform', Connection:'keep-alive', 'X-Accel-Buffering':'no'
  });
  const runId = (req.query.runId as string) || null;

  const sup = getSupervisor();
  const onDecision = (d: unknown) => write(res, 'ai-decision', d);
  sup.bus.on('ai-decision', onDecision);

  const onStart   = (p: any) => { if (!runId || p.runId === runId) write(res, 'optimize-start', p); };
  const onProg    = (p: any) => { if (!runId || p.runId === runId) write(res, 'optimize-progress', p); };
  const onFinish  = (p: any) => { if (!runId || p.runId === runId) write(res, 'optimize-finish', p); };
  const onBest    = (p: any) => { if (!runId || p.runId === runId) write(res, 'optimize-best', p); };
  optimizeHub.on('optimize-start', onStart);
  optimizeHub.on('optimize-progress', onProg);
  optimizeHub.on('optimize-finish', onFinish);
  optimizeHub.on('optimize-best', onBest);

  const onWfStart  = (p: any) => { if (!runId || p.runId === runId) write(res, 'wf-start', p); };
  const onWfProg   = (p: any) => { if (!runId || p.runId === runId) write(res, 'wf-progress', p); };
  const onWfFinish = (p: any) => { if (!runId || p.runId === runId) write(res, 'wf-finish', p); };
  walkforwardHub.on('wf-start', onWfStart);
  walkforwardHub.on('wf-progress', onWfProg);
  walkforwardHub.on('wf-finish', onWfFinish);

  const beat = setInterval(() => write(res, 'heartbeat', { ts: Date.now() }), 1000);
  const keep = setInterval(() => res.write(': keep-alive\n\n'), 15000);

  req.on('close', () => {
    sup.bus.off('ai-decision', onDecision);
    optimizeHub.off('optimize-start', onStart);
    optimizeHub.off('optimize-progress', onProg);
    optimizeHub.off('optimize-finish', onFinish);
    optimizeHub.off('optimize-best', onBest);
    walkforwardHub.off('wf-start', onWfStart);
    walkforwardHub.off('wf-progress', onWfProg);
    walkforwardHub.off('wf-finish', onWfFinish);
    clearInterval(beat); clearInterval(keep);
    res.end();
  });
} 
