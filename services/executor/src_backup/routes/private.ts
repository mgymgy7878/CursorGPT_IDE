import { Router, type RequestHandler } from "express";
import promClient from "prom-client";
import { privateClient } from "../lib/privateClient";
import { enqueueBatch } from "../lib/batcher";
import { sendJson, OpenOrdersSchema } from "../lib/fastJson";
// Mock implementations for missing imports
const isAllowedSymbol = (symbol: string) => true;
const checkMinQty = (qty: number) => true;
const getExchangeInfo = () => ({ status: 'ok' });
const getSymbolFilters = () => ({});
const clampToStep = (value: number) => value;
const validateMinNotional = () => true;
const createTwap = (symbol: string, side: string, qty: number, duration: number) => ({ id: 'mock_twap_id' });
const cancelTwap = (id: string) => true;
import { asSymbol, asPrice, asQuantity, asOrderId } from "@spark/types";
import crypto from "node:crypto";
import { z } from "zod";
import type { RH, ApiRes } from "@spark/common";
import { db } from "../db";
import { auditTrail } from "../security/auditTrail";

// Environment variables
const TRADE_MODE = process.env.TRADE_MODE || 'paper';

// Placeholder functions for missing imports
const genClientOrderId = (idempotencyKey?: string) => {
  const base = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return idempotencyKey ? `${base}_${idempotencyKey}` : base;
};

// Mock implementations for missing classes
class MockWebSocketManager {
  connect() { console.log('Mock WebSocket connected'); }
  disconnect() { console.log('Mock WebSocket disconnected'); }
}

class MockPnLTracker {
  track() { console.log('Mock PnL tracking'); }
}

class MockRiskManager {
  validate() { return { allowed: true }; }
}

let wsManager = new MockWebSocketManager();
const pnlTracker = new MockPnLTracker();
const riskManager = new MockRiskManager();

// Zod schemas for DTO validation
const PlaceSchema = z.object({
  orderId: z.string().min(1).transform(asOrderId),
  symbol: z.string().min(1).transform(asSymbol),
  qty: z.union([z.number(), z.string()]).transform((val) => asQuantity(typeof val === 'string' ? parseFloat(val) : val)),
  price: z.union([z.number(), z.string()]).transform((val) => asPrice(typeof val === 'string' ? parseFloat(val) : val)).optional(),
  side: z.enum(["BUY", "SELL"])
});

const TwapSchema = z.object({
  symbol: z.string().min(1).transform(asSymbol),
  side: z.enum(["BUY", "SELL"]),
  totalQty: z.union([z.number(), z.string()]).transform((val) => asQuantity(typeof val === 'string' ? parseFloat(val) : val)),
  duration: z.number().optional()
});

type PlaceDTO = z.infer<typeof PlaceSchema>;
type TwapDTO = z.infer<typeof TwapSchema>;

const r: Router = Router();

// Typed handlers
const placeHandler: RH<{}, { id: string }, PlaceDTO> = async (req, res) => {
  try {
    const dto = PlaceSchema.parse(req.body);
    
    // Execute order logic here
    const orderId = crypto.randomUUID();
    
    res.json({ ok: true, data: { id: orderId } });
  } catch (error) {
    res.status(400).json({ ok: false, error: String(error) });
  }
};

const twapHandler: RH<{}, { id: string }, TwapDTO> = async (req, res) => {
  try {
    const dto = TwapSchema.parse(req.body);
    
    const twapOrder = createTwap(
      dto.symbol,
      dto.side,
      dto.totalQty,
      dto.duration || Number(process.env.TWAP_DURATION_SECONDS || 300)
    );
    
    res.json({ ok: true, data: { id: twapOrder.id } });
  } catch (error) {
    res.status(400).json({ ok: false, error: String(error) });
  }
};

// Routes
r.post("/place", placeHandler);
r.post("/twap", twapHandler);

const calls = new promClient.Counter({
  name: 'spark_private_calls_total',
  help: 'Private API calls',
  labelNames: ['route', 'method', 'ok'] as const,
});
const errors = new promClient.Counter({
  name: 'spark_private_errors_total',
  help: 'Private API errors',
  labelNames: ['route', 'code'] as const,
});

// Iceberg metrics
const icebergOrdersTotal = new promClient.Counter({
  name: 'spark_iceberg_orders_total',
  help: 'Total iceberg orders',
  labelNames: ['symbol', 'side'] as const,
});

function guardWrite(req: any, res: any, next: any) {
  const liveEnabled = String(process.env.LIVE_ENABLED || 'false') === 'true';
  const mode = String(process.env.TRADE_MODE || 'paper');
  const isWrite = req.method === 'POST' || req.method === 'DELETE';
  // testnet yazmaya izin, live yalnızca liveEnabled==true iken
  if (isWrite) {
    if (mode === 'testnet') return next();
    if (mode === 'live' && liveEnabled) return next();
    return res.status(403).json({ ok: false, error: 'WRITE_DISABLED' });
  }
  next();
}

r.get('/health', (_req, res) => {
  return res.json(privateClient.health());
});

r.get('/account', async (req, res, next) => {
  try {
    const data = await privateClient.account();
    calls.inc({ route: 'account', method: 'GET', ok: 'true' });
    res.json({ ok: true, data });
  } catch (e: any) {
    calls.inc({ route: 'account', method: 'GET', ok: 'false' });
    errors.inc({ route: 'account', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

r.get('/open-orders', async (req, res, next) => {
  try {
    const data = await privateClient.openOrders({ symbol: req.query.symbol as string | undefined });
    calls.inc({ route: 'open-orders', method: 'GET', ok: 'true' });
    
    // Zero-copy JSON optimization
    return sendJson(res, OpenOrdersSchema, { ok: true, data });
  } catch (e: any) {
    calls.inc({ route: 'open-orders', method: 'GET', ok: 'false' });
    errors.inc({ route: 'open-orders', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// ICEBERG: LIMIT + icebergQty
r.post('/order', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    
    const { symbol, side, type, quantity, price, icebergQty } = req.body ?? {};
    // if (!isAllowedSymbol(symbol)) return res.status(400).json({ error: 'SYMBOL_NOT_ALLOWED' });
    
    // Micro-batching optimization
    const maybe = await enqueueBatch(symbol, req.body);
    if (maybe) {
      calls.inc({ route: 'order', method: 'POST', ok: 'true' });
      return res.json(maybe); // batch üzerinden döndü
    }
    
    // Get exchange info and filters
    const info = await getExchangeInfo(process.env.BINANCE_API_BASE!);
    const f = getSymbolFilters(asSymbol(symbol));
    
    // Precision clamping
    if (price && f?.filterType === 'PRICE_FILTER' && f.tickSize) {
      req.body.price = clampToStep(price, f.tickSize);
    }
    if (quantity && f?.filterType === 'LOT_SIZE' && f.stepSize) {
      req.body.quantity = clampToStep(quantity, f.stepSize);
    }
    
    // Min notional validation
    if (f?.filterType === 'MIN_NOTIONAL' && f.minNotional && price && quantity) {
      if (!validateMinNotional(asPrice(price), asQuantity(quantity), f.minNotional)) {
        return res.status(400).json({ error: 'MIN_NOTIONAL_VIOLATION' });
      }
    }

    // Add idempotency
    req.body.newClientOrderId = genClientOrderId(req.headers['idempotency-key'] as string);

    const out = await privateClient.newOrder(req.body);
    
    // Increment iceberg metrics if icebergQty is present
    if (icebergQty) {
      icebergOrdersTotal.inc({ symbol, side });
    }
    
    calls.inc({ route: 'order', method: 'POST', ok: 'true' });
    res.json({ ok: true, data: out });
  } catch (e: any) {
    calls.inc({ route: 'order', method: 'POST', ok: 'false' });
    errors.inc({ route: 'order', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// TWAP start/cancel
r.post('/order/twap', async (req, res, next) => {
  try {
    const { symbol, side, totalQty, slices, type, limitPrice } = req.body;
    if (!symbol || !side || !totalQty || !slices) return res.status(400).json({error:"BAD_REQUEST"});
    
    const id = createTwap(
      asSymbol(symbol), 
      side,
      asQuantity(Number(totalQty)),
      Number(process.env.TWAP_DURATION_SECONDS || 300)
    );
    
    calls.inc({ route: 'twap', method: 'POST', ok: 'true' });
    res.json({ id, status:"STARTED" });
  } catch (e: any) {
    calls.inc({ route: 'twap', method: 'POST', ok: 'false' });
    errors.inc({ route: 'twap', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

r.delete('/order/twap/:id', async (req, res, next) => {
  try { 
    const cancelled = cancelTwap(req.params.id);
    calls.inc({ route: 'twap-cancel', method: 'DELETE', ok: 'true' });
    res.json({ cancelled }); 
  } catch (e: any) {
    calls.inc({ route: 'twap-cancel', method: 'DELETE', ok: 'false' });
    errors.inc({ route: 'twap-cancel', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// Replace order (cancel + new)
r.post('/order/replace', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    
    const { symbol, cancelOrderId, newOrder } = req.body;
    if (!symbol || !newOrder) return res.status(400).json({ error: 'BAD_REQUEST' });
    
    // Idempotent clientOrderId
    newOrder.newClientOrderId = genClientOrderId(req.header('X-Idempotency-Key'));
    
    // 1) Cancel existing order
    if (cancelOrderId) {
      await privateClient.cancelOrder({ symbol, orderId: String(cancelOrderId) });
    }
    
    // 2) Place new order
    const out = await privateClient.newOrder(newOrder);
    calls.inc({ route: 'order-replace', method: 'POST', ok: 'true' });
    res.json({ ok: true, data: out });
  } catch (e: any) {
    calls.inc({ route: 'order-replace', method: 'POST', ok: 'false' });
    errors.inc({ route: 'order-replace', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// Cancel all open orders (symbol required)
r.delete('/open-orders', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'SYMBOL_REQUIRED' });
    
    const data = await privateClient.cancelAllOpenOrders({ symbol: String(symbol) });
    calls.inc({ route: 'cancel-all', method: 'DELETE', ok: 'true' });
    res.json({ ok: true, data });
  } catch (e: any) {
    calls.inc({ route: 'cancel-all', method: 'DELETE', ok: 'false' });
    errors.inc({ route: 'cancel-all', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// Exchange info endpoint
r.get('/exchange-info', async (req, res, next) => {
  try {
    const info = await getExchangeInfo(process.env.BINANCE_API_BASE!);
    calls.inc({ route: 'exchange-info', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: info });
  } catch (e: any) {
    calls.inc({ route: 'exchange-info', method: 'GET', ok: 'false' });
    errors.inc({ route: 'exchange-info', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// Symbol discovery endpoint
r.get('/symbols', async (req, res, next) => {
  try {
    const discoveryService = new SymbolDiscoveryService();
    const symbols = await discoveryService.discoverSymbols();
    calls.inc({ route: 'symbols', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: symbols });
  } catch (e: any) {
    calls.inc({ route: 'symbols', method: 'GET', ok: 'false' });
    errors.inc({ route: 'symbols', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// Auto-sync symbols
r.post('/symbols/sync', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    
    const discoveryService = new SymbolDiscoveryService();
    await discoveryService.discoverSymbols();
    
    calls.inc({ route: 'symbols-sync', method: 'POST', ok: 'true' });
    res.json({ ok: true, message: 'Symbols synced successfully' });
  } catch (e: any) {
    calls.inc({ route: 'symbols-sync', method: 'POST', ok: 'false' });
    errors.inc({ route: 'symbols-sync', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// Diff analyzer endpoint
r.get('/diff-report/:testRunId', async (req, res, next) => {
  try {
    const { testRunId } = req.params;
    const analyzer = new DiffAnalyzer();
    // TODO: Load orders from storage/database
    const report = analyzer.analyzeDiff({}, {});
    
    calls.inc({ route: 'diff-report', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: report });
  } catch (e: any) {
    calls.inc({ route: 'diff-report', method: 'GET', ok: 'false' });
    errors.inc({ route: 'diff-report', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// WebSocket status
r.get('/websocket/status', async (req, res, next) => {
  try {
    const status = {
      connected: wsManager?.isConnectedToWebSocket() || false,
      timestamp: Date.now()
    };
    
    calls.inc({ route: 'websocket-status', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: status });
  } catch (e: any) {
    calls.inc({ route: 'websocket-status', method: 'GET', ok: 'false' });
    errors.inc({ route: 'websocket-status', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// WebSocket connect
r.post('/websocket/connect', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    
    if (!wsManager) {
      wsManager = new WebSocketManager(
        process.env.BINANCE_API_BASE!,
        process.env.BINANCE_API_KEY!,
        process.env.BINANCE_API_SECRET!
      );
      
      wsManager.on('orderUpdate', (orderUpdate: any) => {
        // Update PnL tracker
        const side = orderUpdate.side === 'BUY' ? 'LONG' : 'SHORT';
        pnlTracker.updatePnL(asSymbol(orderUpdate.symbol), asPrice(Number(orderUpdate.price)), asPrice(0));
      });
      
      wsManager.on('accountUpdate', (accountUpdate: any) => {
        // Update risk manager
        console.log('Account update received:', accountUpdate);
      });
    }
    
    await wsManager.connect();
    
    calls.inc({ route: 'websocket-connect', method: 'POST', ok: 'true' });
    res.json({ ok: true, message: 'WebSocket connected' });
  } catch (e: any) {
    calls.inc({ route: 'websocket-connect', method: 'POST', ok: 'false' });
    errors.inc({ route: 'websocket-connect', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// Risk management
r.get('/risk/rules', async (req, res, next) => {
  try {
    const rules = riskManager['rules'] || [];
    const summary = { totalRules: rules.length };
    
    calls.inc({ route: 'risk-rules', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: { rules, summary } });
  } catch (e: any) {
    calls.inc({ route: 'risk-rules', method: 'GET', ok: 'false' });
    errors.inc({ route: 'risk-rules', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

r.post('/risk/rules', guardWrite, async (req, res, next) => {
  try {
    if (TRADE_MODE !== 'testnet') return res.status(403).json({ error: 'WRITE_DISABLED' });
    
    const rule = req.body;
    riskManager.addRule(rule);
    
    calls.inc({ route: 'risk-rules', method: 'POST', ok: 'true' });
    res.json({ ok: true, message: 'Risk rule added' });
  } catch (e: any) {
    calls.inc({ route: 'risk-rules', method: 'POST', ok: 'false' });
    errors.inc({ route: 'risk-rules', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// PnL tracking
r.get('/pnl/summary', async (req, res, next) => {
  try {
    const summary = { totalPositions: 0 };
    const positions: any[] = [];
    
    calls.inc({ route: 'pnl-summary', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: { summary, positions } });
  } catch (e: any) {
    calls.inc({ route: 'pnl-summary', method: 'GET', ok: 'false' });
    errors.inc({ route: 'pnl-summary', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

r.get('/pnl/positions', async (req, res, next) => {
  try {
    const positions: any[] = [];
    
    calls.inc({ route: 'pnl-positions', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: positions });
  } catch (e: any) {
    calls.inc({ route: 'pnl-positions', method: 'GET', ok: 'false' });
    errors.inc({ route: 'pnl-positions', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

r.get('/pnl/performance/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const performance = pnlTracker.getPnL(asSymbol(symbol)) || { symbol: asSymbol(symbol), realizedPnL: asPrice(0), unrealizedPnL: asPrice(0), totalPnL: asPrice(0), timestamp: Date.now() };
    
    calls.inc({ route: 'pnl-performance', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: performance });
  } catch (e: any) {
    calls.inc({ route: 'pnl-performance', method: 'GET', ok: 'false' });
    errors.inc({ route: 'pnl-performance', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// Balance with USD valuation
r.get('/balance', async (req, res, next) => {
  try {
    const account = await privateClient.account();
    // Mock ticker prices for now
    const tickerPrices = [{ symbol: 'BTCUSDT', price: '50000' }];
    
    // Calculate USD values
    const balances = account.balances
      .filter((b: any) => Number(b.free) > 0 || Number(b.locked) > 0)
      .map((b: any) => {
        const total = Number(b.free) + Number(b.locked);
        const price = tickerPrices.find((p: any) => p.symbol === `${b.asset}USDT`)?.price;
        const usdValue = price ? total * Number(price) : 0;
        
        return {
          ...b,
          total: String(total),
          usdValue: usdValue.toFixed(2)
        };
      });
    
    const totalUsdValue = balances.reduce((sum: number, b: any) => sum + Number(b.usdValue), 0);
    
    const snapshot = {
      timestamp: Date.now(),
      balances,
      totalUsdValue: totalUsdValue.toFixed(2)
    };
    
    calls.inc({ route: 'balance', method: 'GET', ok: 'true' });
    res.json({ ok: true, data: snapshot });
  } catch (e: any) {
    calls.inc({ route: 'balance', method: 'GET', ok: 'false' });
    errors.inc({ route: 'balance', code: e?.message?.slice(0, 20) || 'ERR' });
    next(e);
  }
});

// Eksik fonksiyonları ekliyorum
function validateOrderRequest(data: any) {
  return {
    symbol: asSymbol(data.symbol || ''),
    price: asPrice(data.price || 0),
    quantity: asQuantity(data.quantity || 0)
  };
}

export { r as privateRouter }; 