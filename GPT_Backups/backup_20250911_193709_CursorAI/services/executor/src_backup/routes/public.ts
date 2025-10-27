import { Router } from "express";
import { z } from "zod";

const router = Router();

// Strategy mode schema
const StrategyModeSchema = z.object({
  mode: z.enum(['grid', 'trend', 'scalp', 'stop', 'start'])
});

// Risk settings schema
const RiskSetSchema = z.object({
  percent: z.number().min(0.1).max(5.0)
});

// Manager summary endpoint
router.get('/manager/summary', (req, res) => {
  res.json({
    ok: true,
    source: "mock",
    data: {
      period: "günlük",
      ts: new Date().toISOString(),
      trading: {
        mode: "trend",
        activePositions: 3,
        totalTrades: 42,
        winRate: 0.65,
        avgWin: 125.5,
        avgLoss: -85.3
      },
      performance: {
        pnl: 1250.75,
        roi: 0.125,
        sharpe: 1.85,
        maxDrawdown: -0.08
      },
      risk: {
        exposure: 0.45,
        leverage: 1.2,
        var: -850.0
      }
    }
  });
});

// Strategy mode endpoint
router.post('/strategy/mode', (req, res) => {
  try {
    const { mode } = StrategyModeSchema.parse(req.body);
    res.json({
      ok: true,
      message: `Strategy mode changed to ${mode}`,
      data: { mode }
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid mode data'
    });
  }
});

// Risk settings endpoint
router.post('/risk/set', (req, res) => {
  try {
    const { percent } = RiskSetSchema.parse(req.body);
    res.json({
      ok: true,
      message: `Risk set to ${percent}%`,
      data: { percent }
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid risk data'
    });
  }
});

// Portfolio summary endpoint
router.get('/portfolio/summary', (req, res) => {
  res.json({
    ok: true,
    data: {
      totalNotional: 35000,
      realizedPnl: 2340.75,
      unrealizedPnl: 1250.50,
      bySymbol: [
        {
          symbol: "BTCUSDT",
          notional: 22500,
          qty: 0.5,
          uPnl: 1250.50,
          side: "LONG"
        },
        {
          symbol: "ETHUSDT",
          notional: 6400,
          qty: 2.0,
          uPnl: -180.25,
          side: "LONG"
        }
      ],
      risk: {
        exposurePct: 45.2,
        leverageEst: 3.5,
        positions: 2,
        longPositions: 2,
        shortPositions: 0
      },
      ts: new Date().toISOString()
    }
  });
});

export { router as publicRouter }; 