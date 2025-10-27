import type { FastifyPluginCallback } from 'fastify';
import { createHmac } from 'node:crypto';
import { request } from 'undici';

type Body = { apiKey: string; apiSecret: string };

const BINANCE_TESTNET = 'https://testnet.binance.vision';

const binanceTestRoute: FastifyPluginCallback = (fastify, _opts, done) => {
  // NOTE: This route is RBAC-protected by the global auth guard (if configured)
  fastify.post('/exec/test/binance', async (req, reply) => {
    const body = req.body as Body;
    if (!body?.apiKey || !body?.apiSecret) {
      reply.code(400);
      return { ok: false, error: 'apiKey/apiSecret required' };
    }

    const { body: res } = await request(`${BINANCE_TESTNET}/api/v3/time`);
    const data = (await res.json()) as { serverTime: number };
    const serverTime = data.serverTime;

    const payload = `timestamp=${serverTime}`;
    const sig = createHmac('sha256', body.apiSecret).update(payload).digest('hex');

    const now = Date.now();
    const driftMs = serverTime - now;

    return {
      ok: true,
      serverTime,
      timeDriftMs: driftMs,
      signatureSample: sig.slice(0, 12),
      note:
        'This is an offline signature check. For live connectivity, call a private endpoint with X-MBX-APIKEY and this signature.',
    };
  });

  done();
};

export default binanceTestRoute;


