import type { RH, ApiRes } from "@spark/common";
import { Router } from "express";
import promClient from "prom-client";

const router = Router();

// Metrics
let sparkBacktestRunsTotal: promClient.Counter;

try {
  sparkBacktestRunsTotal = new promClient.Counter({
    name: 'spark_backtest_runs_total',
    help: 'Total backtest runs',
    labelNames: ['strategy'] as const,
    registers: [promClient.register]
  });
} catch (error) {
  // Metric already exists, get existing one
  sparkBacktestRunsTotal = promClient.register.getSingleMetric('spark_backtest_runs_total') as promClient.Counter;
}

interface BacktestParams {
  symbol: string;
  interval: string;
  startTime: number;
  endTime: number;
  initialBalance: number;
  strategy: string;
  params?: Record<string, any>;
}

interface BacktestResult {
  trades: Array<{
    id: string;
    orderId: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    fee: number;
    feeBps: number;
    timestamp: number;
  }>;
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    totalFees: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  metadata: {
    symbol: string;
    interval: string;
    startTime: number;
    endTime: number;
    initialBalance: number;
    finalBalance: number;
  };
}

router.post('/run', (req, res) => {
  try {
    const { symbol, interval, startTime, endTime, initialBalance, strategy, params } = req.body as BacktestParams;

    // Validate required fields
    if (!symbol || !interval || !startTime || !endTime || !initialBalance) {
      return res.status(400).json({ 
        error: 'Missing required fields: symbol, interval, startTime, endTime, initialBalance' 
      });
    }

    // Validate time range
    const maxBars = 10000;
    const timeRange = endTime - startTime;
    const intervalMs = getIntervalMs(interval);
    const estimatedBars = timeRange / intervalMs;

    if (estimatedBars > maxBars) {
      return res.status(413).json({ 
        error: `Time range too large. Max ${maxBars} bars allowed. Estimated: ${Math.ceil(estimatedBars)} bars` 
      });
    }

    // Generate mock backtest result
    const result = generateMockBacktestResult({
      symbol,
      interval,
      startTime,
      endTime,
      initialBalance,
      strategy,
      params
    });

    // Update metrics
    sparkBacktestRunsTotal.inc({ strategy: strategy || 'unknown' });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// TWAP backtest endpoint
router.post('/twap', async (req, res, next) => {
  try {
    const { symbol, side, totalQty, slices, type, limitPrice } = req.body;
    
    // Mock TWAP backtest result
    const result = { 
      fills: slices, 
      avgPrice: limitPrice || 50000, 
      slippage: 0.001, 
      pnl: totalQty * 100 // Mock PnL
    };
    
    res.json(result);
  } catch (e) { 
    next(e); 
  }
});

function getIntervalMs(interval: string): number {
  const intervals: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  };
  return intervals[interval] || 60 * 1000;
}

function generateMockBacktestResult(params: BacktestParams): BacktestResult {
  const { symbol, interval, startTime, endTime, initialBalance, strategy } = params;
  
  // Generate mock trades
  const trades = [];
  const numTrades = Math.floor(Math.random() * 50) + 10; // 10-60 trades
  let currentBalance = initialBalance;
  let basePrice = 50000;
  
  for (let i = 0; i < numTrades; i++) {
    const timestamp = startTime + (i * (endTime - startTime) / numTrades);
    const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
    const quantity = Math.random() * 0.1 + 0.01; // 0.01-0.11 BTC
    const price = basePrice + (Math.random() - 0.5) * 1000; // ±500 from base
    const fee = (quantity * price * 0.001); // 0.1% fee
    
    trades.push({
      id: `trade_${timestamp}_${i}`,
      orderId: `order_${timestamp}_${i}`,
      symbol,
      side,
      quantity,
      price,
      fee,
      feeBps: 10, // 0.1% fee
      timestamp
    });
    
    // Update balance and base price
    if (side === 'buy') {
      currentBalance -= (quantity * price + fee);
      basePrice = price * 1.001; // Slight upward bias
    } else {
      currentBalance += (quantity * price - fee);
      basePrice = price * 0.999; // Slight downward bias
    }
  }
  
  // Calculate summary
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => 
    (t.side === 'buy' && t.price > basePrice) || 
    (t.side === 'sell' && t.price < basePrice)
  ).length;
  const losingTrades = totalTrades - winningTrades;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);
  const totalPnL = currentBalance - initialBalance;
  const maxDrawdown = Math.abs(Math.min(...trades.map(t => t.price - basePrice)));
  const sharpeRatio = totalPnL > 0 ? totalPnL / (totalFees + 1) : 0;
  
  return {
    trades,
    summary: {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnL,
      totalFees,
      maxDrawdown,
      sharpeRatio
    },
    metadata: {
      symbol,
      interval,
      startTime,
      endTime,
      initialBalance,
      finalBalance: currentBalance
    }
  };
}

export default router; 