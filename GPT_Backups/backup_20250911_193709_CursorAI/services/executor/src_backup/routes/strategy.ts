import type { RH, ApiRes } from "@spark/common";
import { Router } from "express";
import { StrategyCodeGenerator } from "@spark/strategy-codegen";
import { BacktestEngine } from "../backtest/engine";
import { BinanceTestnetBroker } from "../paper/broker.binance.testnet";

const router = Router();

// Mock strategy for testing (in real implementation, this would be generated)
class MockStrategy {
  init() {}
  onBar(bar: any) { return []; }
  onTick(tick: any) { return []; }
  getState() { return {}; }
}

// Mock OHLCV data for testing
const mockOHLCVData = [
  { timestamp: Date.now() - 86400000, open: 45000, high: 45500, low: 44800, close: 45200, volume: 1000 },
  { timestamp: Date.now() - 82800000, open: 45200, high: 45800, low: 45000, close: 45600, volume: 1200 },
  { timestamp: Date.now() - 79200000, open: 45600, high: 46000, low: 45300, close: 45800, volume: 1100 },
  { timestamp: Date.now() - 75600000, open: 45800, high: 46200, low: 45500, close: 46000, volume: 1300 },
  { timestamp: Date.now() - 72000000, open: 46000, high: 46500, low: 45800, close: 46300, volume: 1400 }
];

// Metrics tracking
declare global {
  var sparkStrategyMetrics: {
    generate: { inc: (labels: { status: string }) => void };
    build: { inc: (labels: { status: string }) => void };
    backtest: { inc: (labels: { status: string }) => void };
    backtestDuration: { observe: (labels: { strategy: string }, value: number) => void };
    paperDeploy: { inc: (labels: { status: string }) => void };
    failures: { inc: (labels: { stage: string; reason: string }) => void };
  } | undefined;
}

// Mock metrics
if (!global.sparkStrategyMetrics) {
  global.sparkStrategyMetrics = {
    generate: { inc: () => {} },
    build: { inc: () => {} },
    backtest: { inc: () => {} },
    backtestDuration: { observe: () => {} },
    paperDeploy: { inc: () => {} },
    failures: { inc: () => {} }
  };
}

// POST /api/public/strategy/generate
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        ok: false,
        error: 'missing_prompt',
        message: 'Prompt is required'
      });
    }

    // TODO: Implement LLM integration for strategy generation
    // For now, return a mock DSL
    const mockDSL = {
      name: "Generated Strategy",
      description: "AI-generated strategy from prompt",
      symbol: "BTCUSDT",
      timeframe: "1h",
      indicators: {
        sma: { period: 20, source: "close" },
        rsi: { period: 14, source: "close" }
      },
      conditions: {
        rsi_oversold: { type: "rsi_oversold", operator: "<", value: 30 },
        rsi_overbought: { type: "rsi_overbought", operator: ">", value: 70 }
      },
      rules: {
        entry: [
          { condition: "rsi_oversold", action: "BUY", quantity: 0.01, price: "MARKET" }
        ],
        exit: [
          { condition: "rsi_overbought", action: "CLOSE_LONG", quantity: 0.01, price: "MARKET" }
        ]
      },
      risk: {
        riskPct: 2.0,
        maxPos: 1,
        maxDailyLoss: 100
      }
    };

    if (global.sparkStrategyMetrics?.generate) {
      global.sparkStrategyMetrics.generate.inc({ status: 'success' });
    }

    res.json({
      ok: true,
      dsl: mockDSL,
      message: 'Strategy generated successfully (mock)'
    });

  } catch (error: any) {
    if (global.sparkStrategyMetrics?.generate) {
      global.sparkStrategyMetrics.generate.inc({ status: 'error' });
    }
    if (global.sparkStrategyMetrics?.failures) {
      global.sparkStrategyMetrics.failures.inc({ stage: 'generate', reason: error.message });
    }
    
    res.status(500).json({
      ok: false,
      error: 'generation_failed',
      message: error.message
    });
  }
});

// POST /api/public/strategy/build
router.post('/build', async (req, res) => {
  try {
    const { dsl } = req.body;
    
    if (!dsl) {
      return res.status(400).json({
        ok: false,
        error: 'missing_dsl',
        message: 'DSL is required'
      });
    }

    const generator = new StrategyCodeGenerator();
    const result = generator.generate(dsl);

    if (global.sparkStrategyMetrics?.build) {
      global.sparkStrategyMetrics.build.inc({ status: 'success' });
    }

    res.json({
      ok: true,
      artifactId: result.artifactId,
      metadata: result.metadata,
      message: 'Strategy built successfully'
    });

  } catch (error: any) {
    if (global.sparkStrategyMetrics?.build) {
      global.sparkStrategyMetrics.build.inc({ status: 'error' });
    }
    if (global.sparkStrategyMetrics?.failures) {
      global.sparkStrategyMetrics.failures.inc({ stage: 'build', reason: error.message });
    }
    
    res.status(400).json({
      ok: false,
      error: 'build_failed',
      message: error.message
    });
  }
});

// POST /api/public/strategy/backtest
router.post('/backtest', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { artifactId, symbol, startDate, endDate, initialCapital = 10000 } = req.body;
    
    if (!artifactId) {
      return res.status(400).json({
        ok: false,
        error: 'missing_artifactId',
        message: 'Artifact ID is required'
      });
    }

    // Create mock strategy instance
    const strategy = new MockStrategy();
    
    // Run backtest
    const engine = new BacktestEngine({
      strategy,
      data: mockOHLCVData,
      initialCapital,
      commission: 0.1, // 0.1%
      slippage: 0.05,  // 0.05%
      startDate,
      endDate
    });

    const report = await engine.run();
    const duration = Date.now() - startTime;

    if (global.sparkStrategyMetrics?.backtest) {
      global.sparkStrategyMetrics.backtest.inc({ status: 'success' });
    }
    if (global.sparkStrategyMetrics?.backtestDuration) {
      global.sparkStrategyMetrics.backtestDuration.observe({ strategy: artifactId }, duration / 1000);
    }

    res.json({
      ok: true,
      artifactId,
      report,
      message: 'Backtest completed successfully'
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (global.sparkStrategyMetrics?.backtest) {
      global.sparkStrategyMetrics.backtest.inc({ status: 'error' });
    }
    if (global.sparkStrategyMetrics?.failures) {
      global.sparkStrategyMetrics.failures.inc({ stage: 'backtest', reason: error.message });
    }

    res.status(500).json({
      ok: false,
      error: 'backtest_failed',
      message: error.message
    });
  }
});

// POST /api/public/strategy/deploy-paper
router.post('/deploy-paper', async (req, res) => {
  try {
    const { artifactId, symbol, risk } = req.body;
    
    if (!artifactId || !symbol) {
      return res.status(400).json({
        ok: false,
        error: 'missing_params',
        message: 'Artifact ID and symbol are required'
      });
    }

    // Check if trading is enabled
    if (process.env.TRADING_KILL_SWITCH === '1') {
      return res.status(503).json({
        ok: false,
        error: 'trading_disabled',
        message: 'Trading is currently disabled'
      });
    }

    // Initialize broker
    const apiKey = process.env.BINANCE_TESTNET_API_KEY || 'test-key';
    const apiSecret = process.env.BINANCE_TESTNET_API_SECRET || 'test-secret';
    const broker = new BinanceTestnetBroker(apiKey, apiSecret);

    // Create run ID
    const runId = `RUN-${artifactId}-${Date.now()}`;

    if (global.sparkStrategyMetrics?.paperDeploy) {
      global.sparkStrategyMetrics.paperDeploy.inc({ status: 'success' });
    }

    res.json({
      ok: true,
      runId,
      artifactId,
      symbol,
      message: 'Paper trading deployed successfully',
      risk: {
        maxPos: risk?.maxPos || 1,
        dailyLossCap: risk?.dailyLossCap || 100
      }
    });

  } catch (error: any) {
    if (global.sparkStrategyMetrics?.paperDeploy) {
      global.sparkStrategyMetrics.paperDeploy.inc({ status: 'error' });
    }
    if (global.sparkStrategyMetrics?.failures) {
      global.sparkStrategyMetrics.failures.inc({ stage: 'paper_deploy', reason: error.message });
    }
    
    res.status(500).json({
      ok: false,
      error: 'deploy_failed',
      message: error.message
    });
  }
});

export default router; 