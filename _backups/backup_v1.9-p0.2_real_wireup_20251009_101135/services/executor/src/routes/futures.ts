import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { makeFuturesFromEnv, makeFuturesFromEnvSafe } from "../lib/binance-futures.js";
import { futuresOrdersBlockedTotal, futuresUdsLifecycleTotal, futuresUdsLastKeepaliveTs } from "../metrics.js";
import { writeJSONFile } from "../lib/fs-helpers.js";

const requireJwt = (app: FastifyInstance) => (app as any).authenticate
  ? [(app as any).authenticate]
  : [];

export default fp(async function futuresRoutes(app: FastifyInstance) {
  const fut = makeFuturesFromEnvSafe();

  app.get("/time", async (_req: any, reply: any) => {
    if (!fut) return reply.code(503).send({ ok: false, error: 'BINANCE_FUTURES_BASE_URL missing' });
    const r = await fut.time();
    reply.send(r);
  });

  app.get("/exchangeInfo", async (req: any, reply: any) => {
    if (!fut) return reply.code(503).send({ ok: false, error: 'BINANCE FUTURES client not initialized' });
    const q = (req.query ?? {}) as any;
    try {
      if (!q.symbol) return await fut.exchangeInfo();           // genel info
      const res = await fut.exchangeInfo(q.symbol);             // tek sembol
      // bazı client'lar sembol bulunamazsa 404 döndürüyor → 200 + açıklama tercih edelim
      if (!res?.symbols?.length) return reply.code(200).send({ ok:false, reason:'symbol not found', symbol:q.symbol, ...res });
      return res;
    } catch (e:any) {
      // upstream 404'lerini 200/ açıklayıcı JSON'a çevirerek gürültüyü azalt
      return reply.code(200).send({ ok:false, error:e.message ?? 'exchangeInfo failed', symbol:q.symbol });
    }
  });

  app.get("/klines", async (req: any, reply: any) => {
    if (!fut) return reply.code(503).send({ ok: false, error: 'BINANCE FUTURES client not initialized' });
    const { symbol, interval, limit, startTime, endTime } = (req.query ?? {}) as any;
    const r = await fut.klines({ symbol, interval, limit: limit?Number(limit):undefined, startTime:startTime?Number(startTime):undefined, endTime:endTime?Number(endTime):undefined });
    reply.send(r);
  });

  app.get("/bookTicker", async (req: any, reply: any) => {
    const { symbol } = (req.query ?? {}) as any;
    const r = await fut.bookTicker({ symbol });
    reply.send(r);
  });

  // ---- signed (protected)
  app.get("/account", { preHandler: requireJwt(app) }, async (_req: any, reply: any) => {
    const r = await fut.account();
    reply.send(r);
  });

  app.get("/positionRisk", { preHandler: requireJwt(app) }, async (req: any, reply: any) => {
    const { symbol } = (req.query ?? {}) as any;
    const r = await fut.positionRisk(symbol ? { symbol } : {});
    reply.send(r);
  });

  app.post("/order", { preHandler: requireJwt(app) }, async (req: any, reply: any) => {
    const body = (req.body as any) || {};
    const gatesLive = process.env.LIVE_TRADING === "true" && process.env.LIVE_FUTURES_ENABLED === "true";
    const whitelist = (process.env.SYMBOL_WHITELIST || "BTCUSDT,ETHUSDT").split(",").map(s=>s.trim()).filter(Boolean);
    const maxLev = Number(process.env.MAX_LEVERAGE_DEFAULT ?? 5);
    const minNot = Number(process.env.MIN_NOTIONAL_USDT ?? 10);
    const { symbol, side, type, notional, leverage } = body;
    if (!whitelist.includes(symbol)) { futuresOrdersBlockedTotal.inc({ reason:'whitelist' } as any); return reply.code(400).send({ error:"symbol_not_allowed", confirm_required:true }); }
    if (Number(leverage)>maxLev)     { futuresOrdersBlockedTotal.inc({ reason:'max_leverage' } as any); return reply.code(400).send({ error:"leverage_too_high", confirm_required:true }); }
    if (Number(notional)<minNot)     { futuresOrdersBlockedTotal.inc({ reason:'min_notional' } as any); return reply.code(400).send({ error:"notional_too_small", confirm_required:true }); }
    if (!gatesLive) { futuresOrdersBlockedTotal.inc({ reason:'gate_closed' } as any); return reply.code(403).send({ error:"live_gates_closed", confirm_required:true }); }
    const res = await fut.createOrder(body);
    try { await writeJSONFile(`evidence/local/executions/${Date.now()}_${symbol}.json`, { req: { symbol, side, type, notional, leverage }, res }); } catch {}
    reply.send(res);
  });

  app.delete("/order", { preHandler: requireJwt(app) }, async (req: any, reply: any) => {
    const { symbol, orderId, origClientOrderId } = (req.query ?? {}) as any;
    const r = await fut.cancelOrder({ symbol, orderId: orderId?Number(orderId):undefined, origClientOrderId });
    reply.send(r);
  });

  app.get("/order", { preHandler: requireJwt(app) }, async (req: any, reply: any) => {
    const { symbol, orderId, origClientOrderId } = (req.query ?? {}) as any;
    const r = await fut.getOrder({ symbol, orderId: orderId?Number(orderId):undefined, origClientOrderId });
    reply.send(r);
  });

  app.get("/openOrders", { preHandler: requireJwt(app) }, async (req: any, reply: any) => {
    const { symbol } = (req.query ?? {}) as any;
    const r = await fut.openOrders(symbol ? { symbol } : {});
    reply.send(r);
  });

  // UserDataStream lifecycle (testnet supports same endpoints)
  app.post("/userDataStream", { preHandler: requireJwt(app) }, async (_req:any, reply:any) => {
    try { const r = await fut.createListenKey(); futuresUdsLifecycleTotal.inc({ action:'create', status:'ok' } as any); return reply.send(r); }
    catch (e:any) { futuresUdsLifecycleTotal.inc({ action:'create', status:'err' } as any); return reply.code(500).send({ error:'uds_create_failed', message: e?.message || String(e) }); }
  });
  app.put("/userDataStream", { preHandler: requireJwt(app) }, async (req:any, reply:any) => {
    const listenKey = (req.body as any)?.listenKey || (req.query as any)?.listenKey;
    try { const r = await fut.keepAliveListenKey(listenKey); futuresUdsLifecycleTotal.inc({ action:'keepalive', status:'ok' } as any); futuresUdsLastKeepaliveTs.set(Date.now()); return reply.send(r); }
    catch (e:any) { futuresUdsLifecycleTotal.inc({ action:'keepalive', status:'err' } as any); return reply.code(500).send({ error:'uds_keepalive_failed', message: e?.message || String(e) }); }
  });
  app.delete("/userDataStream", { preHandler: requireJwt(app) }, async (req:any, reply:any) => {
    const listenKey = (req.body as any)?.listenKey || (req.query as any)?.listenKey;
    try { const r = await fut.closeListenKey(listenKey); futuresUdsLifecycleTotal.inc({ action:'close', status:'ok' } as any); return reply.send(r); }
    catch (e:any) { futuresUdsLifecycleTotal.inc({ action:'close', status:'err' } as any); return reply.code(500).send({ error:'uds_close_failed', message: e?.message || String(e) }); }
  });

  app.post("/leverage", { preHandler: requireJwt(app) }, async (req: any, reply: any) => {
    const body = req.body as any; // { symbol, leverage }
    const r = await fut.setLeverage(body);
    reply.send(r);
  });

  app.post("/marginType", { preHandler: requireJwt(app) }, async (req: any, reply: any) => {
    const body = req.body as any; // { symbol, marginType }
    const r = await fut.setMarginType(body);
    reply.send(r);
  });
});


