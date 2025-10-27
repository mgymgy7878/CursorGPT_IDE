import fp from "fastify-plugin";
import type { FastifyInstance } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

const QuerySchema = Type.Object({ symbol: Type.String({ minLength: 3 }) });

const Ticker = Type.Object({
  symbol: Type.String(),
  last:   Type.Number(),
  bid:    Type.Number(),
  ask:    Type.Number(),
  ts:     Type.Number(),
  venue:  Type.Literal('btcturk'),
  mock:   Type.Boolean(),
});

type Query = Static<typeof QuerySchema>;
type TickerT = Static<typeof Ticker>;

export default fp(async function btcturkRoutes(app: FastifyInstance) {
  // Existing smoke endpoint
  app.post('/btcturk/smoke', async (_req, reply) => {
    const envOK = !!(process.env.BTCTURK_API_KEY && process.env.BTCTURK_API_SECRET_BASE64);
    const live = String(process.env.BTCTURK_LIVE || '0') === '1';
    return reply.send({ ok: true, envOK, live, note: 'connector' });
  });

  // New type-safe ticker endpoint
  app.get<{ Querystring: Query; Reply: { ok: true; data: TickerT } }>(
    '/public/btcturk/ticker',
    {
      schema: {
        querystring: QuerySchema,
        response: { 200: Type.Object({ ok: Type.Literal(true), data: Ticker }) },
        tags: ['public'],
      },
    },
    async (req, reply) => {
      const { symbol } = req.query;
      // TODO: gerçek BTCTurk entegrasyonu; şimdilik mock
      const data: TickerT = {
        symbol, last: 0, bid: 0, ask: 0, ts: Date.now(), venue: 'btcturk', mock: true
      };
      return reply.send({ ok: true, data });
    }
  );
}); 