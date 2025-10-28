import { FastifyInstance } from 'fastify';
import { getKey, loadAll, setKey } from "../store/keys.js";
import { BinanceFutures } from "../exchanges/binanceFutures.js";
import { runStrategy } from "../runner/runner.js";

loadAll();

export default async function routes(app: FastifyInstance) {
  // 1) API key set + test
  app.post('/exchange/connect', async (req, reply) => {
    const { exchange, env, apiKey, apiSecret } = (req.body as any) || {};
    if (exchange !== 'binance-futures') return reply.code(400).send({ ok:false, error:'only binance-futures supported in MVP' });
    if (!apiKey || !apiSecret || !env) return reply.code(400).send({ ok:false, error:'missing fields' });

    setKey('default', { exchange, env, apiKey, apiSecret });
    const k = getKey('default');
    if (!k) return reply.code(500).send({ ok:false, error:'store failed' });

    const bin = new BinanceFutures({ apiKey: k.apiKey, apiSecret: k.apiSecret, env: k.env });
    const test = await bin.testAuth();
    return reply.send({ ok:true, env: k.env, test });
  });

  // 2) Run strategy (AI'den gelen JS kodu)
  app.post('/strategy/run', async (req, reply) => {
    const { code, symbols, env, dryRun } = (req.body as any) || {};
    if (!code || !symbols?.length) return reply.code(400).send({ ok:false, error:'code/symbols required' });
    const k = getKey('default');
    if (!k) return reply.code(400).send({ ok:false, error:'set API keys first' });
    const bin = new BinanceFutures({ apiKey: k.apiKey, apiSecret: k.apiSecret, env: env || k.env });

    try {
      const res = await runStrategy(code, bin, symbols, !!dryRun);
      return reply.send({ ok:true, res });
    } catch (err: any) {
      return reply.code(500).send({ ok:false, error: err?.message || String(err) });
    }
  });

  // 3) Stop/Status — MVP: stateless stub
  app.post('/strategy/stop', async (_req, reply) => reply.send({ ok:true, stopped:true }));
  app.get('/strategy/status', async (_req, reply) => reply.send({ ok:true, running:false }));
}
