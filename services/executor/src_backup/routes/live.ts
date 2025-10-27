import type { RH, ApiRes } from "@spark/common";
import express from "express";
import { getPrisma } from "@spark/db";
import { metrics } from "../metrics";

const router = express.Router();

// Health endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      exchange: 'up', // TODO: Check Binance API status
      ws: 'up', // TODO: Check WebSocket connection
      drift: 0, // TODO: Calculate reconciliation drift
      killSwitch: process.env.TRADING_KILL_SWITCH === '1',
      circuit: 'closed' // TODO: Check circuit breaker status
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Snapshot endpoint
router.get('/snapshot', async (req, res) => {
  try {
    const now = new Date().toISOString();
    
    // Environment readiness checks
    const hasKeys = !!(process.env.BINANCE_MAINNET_API_KEY && process.env.BINANCE_MAINNET_API_SECRET);
    const hasToken = !!process.env.EXECUTOR_TOKEN;
    const whitelistOk = process.env.TRADE_WHITELIST?.includes('BTCUSDT') || false;
    
    // Trade window check
    const tradeWindow = process.env.TRADE_WINDOW || '07:00-23:30';
    const nowTime = new Date();
    const istTime = new Date(nowTime.getTime() + (3 * 60 * 60 * 1000)); // UTC+3 for Istanbul
    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const [startTime, endTime] = tradeWindow.split('-');
    const [startHour, startMin] = (startTime || '07:00').split(':').map(Number);
    const [endHour, endMin] = (endTime || '23:30').split(':').map(Number);
    const startMinutes = (startHour || 7) * 60 + (startMin || 0);
    const endMinutes = (endHour || 23) * 60 + (endMin || 30);
    
    const windowNow = currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes;
    
    const envReady = {
      hasKeys,
      hasToken,
      whitelistOk,
      windowNow
    };
    
    const limits = {
      maxNotional: parseFloat(process.env.LIVE_MAX_NOTIONAL || '20'),
      tradeWindow
    };
    
    // Get open orders count
    const openOrders = await getPrisma().order.count({
      where: { status: 'NEW' }
    });
    
    // Get trades in last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const tradesLastMin = await getPrisma().trade.count({
      where: {
        ts: {
          gte: oneMinuteAgo
        }
      }
    });
    
    // Get positions
    const positions = await getPrisma().position.findMany({
      select: {
        symbol: true,
        qty: true,
        avgPrice: true,
        unrealized: true
      }
    });
    
    // Get metrics (mock for now, should come from Prometheus)
    const metrics = {
      live_orders_filled: await getPrisma().order.count({
        where: { status: 'FILLED' }
      }),
      live_trades_total: await getPrisma().trade.count(),
      live_blocked_total: {
        arm_only: 0, // TODO: Get from Prometheus
        rule_violation: 0,
        notional_limit: 0
      }
    };
    
    const snapshot = {
      now,
      exchange: 'up', // TODO: Check Binance API status
      ws: 'up', // TODO: Check WebSocket connection
      drift: 0, // TODO: Calculate reconciliation drift
      envReady,
      limits,
      openOrders,
      tradesLastMin,
      positions,
      metrics
    };
    
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Snapshot failed' });
  }
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    // TODO: Return Prometheus metrics
    res.set('Content-Type', 'text/plain');
    res.send('# HELP spark_live_orders_total Total live orders\n# TYPE spark_live_orders_total counter\nspark_live_orders_total{status="FILLED"} 0\nspark_live_orders_total{status="NEW"} 0\n');
  } catch (error) {
    res.status(500).json({ error: 'Metrics failed' });
  }
});

export default router; 