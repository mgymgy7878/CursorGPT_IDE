import type { FastifyPluginCallback } from 'fastify';
import { createHmac } from 'node:crypto';

/**
 * BTCTurk "offline signature" test:
 * Tipik imzalama: X-Stamp (ms), METHOD+PATH (örn: GET/api/v1/users/balances),
 * HMAC-SHA256(secret, stamp+method+path). Bu uç sadece imza üretip örnek döner; canlı çağrı yapmaz.
 */
type Body = { apiKey: string; apiSecret: string };

const btcturkTestRoute: FastifyPluginCallback = (fastify, _opts, done) => {
  // RBAC global guard altında çalışır (Bearer gerekiyorsa 401 döner)
  fastify.post('/exec/test/btcturk', async (req, reply) => {
    const body = req.body as Body;
    if (!body?.apiKey || !body?.apiSecret) {
      reply.code(400);
      return { ok: false, error: 'apiKey/apiSecret required' };
    }

    const stamp = Date.now().toString(); // X-Stamp örneği
    const method = 'GET';
    const path = '/api/v1/users/balances'; // örnek, değiştirilebilir
    const payload = `${stamp}${method}${path}`;

    const sig = createHmac('sha256', body.apiSecret)
      .update(payload)
      .digest('hex');

    return {
      ok: true,
      stamp: Number(stamp),
      method,
      path,
      signatureSample: sig.slice(0, 12),
      note:
        "Offline signature sample only. Live test için X-PCK/X-Stamp/X-Signature header'larıyla gerçek özel endpoint çağrısı atılmalı.",
    };
  });

  done();
};

export default btcturkTestRoute;


