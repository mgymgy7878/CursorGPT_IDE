import type { RH, ApiRes } from "@spark/common";
import express from "express";
import { SignalProcessor } from "../signalProcessing/SignalProcessor";
import type { TradingSignal } from "../signalProcessing/types";
import { SignalPriority } from "../signalProcessing/types";

const router = express.Router();

// Global signal processor instance
let signalProcessor: SignalProcessor | null = null;

// Initialize signal processor
function getSignalProcessor(): SignalProcessor {
  if (!signalProcessor) {
    signalProcessor = new SignalProcessor({
      maxConcurrentSignals: 3,
      processingIntervalMs: 1000,
      maxQueueSize: 100,
      enableAutoExecution: true,
      enableRiskGuards: true,
      enableMetrics: true
    });
  }
  return signalProcessor;
}

// Signal submission endpoint
router.post('/submit', async (req, res) => {
  try {
    const processor = getSignalProcessor();
    const signalData = req.body;

    // Validate required fields
    if (!signalData.symbol || !signalData.action || !signalData.confidence) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, action, confidence'
      });
    }

    // Create trading signal
    const signal: TradingSignal = {
      id: signalData.id || `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: signalData.symbol,
      action: signalData.action,
      confidence: Math.max(0, Math.min(1, signalData.confidence)),
      reasoning: signalData.reasoning || 'No reasoning provided',
      strategyId: signalData.strategyId,
      timeframe: signalData.timeframe || 'medium',
      riskLevel: signalData.riskLevel || 'medium',
      timestamp: new Date(),
      executed: false,
      priority: signalData.priority || SignalPriority.NORMAL,
      metadata: signalData.metadata
    };

    // Submit signal
    const success = await processor.submitSignal(signal);

    if (success) {
      res.json({
        success: true,
        signalId: signal.id,
        message: 'Signal submitted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Signal submission failed'
      });
    }
  } catch (error) {
    console.error('Signal submission error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get signal processor status
router.get('/status', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const status = processor.getStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get signal metrics
router.get('/metrics', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const metrics = processor.getMetrics();
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Start signal processor
router.post('/start', async (req, res) => {
  try {
    const processor = getSignalProcessor();
    await processor.start();
    
    res.json({
      success: true,
      message: 'Signal processor started'
    });
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Stop signal processor
router.post('/stop', async (req, res) => {
  try {
    const processor = getSignalProcessor();
    await processor.stop();
    
    res.json({
      success: true,
      message: 'Signal processor stopped'
    });
  } catch (error) {
    console.error('Stop error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Clear signal queue
router.post('/clear-queue', (req, res) => {
  try {
    const processor = getSignalProcessor();
    processor.clearQueue();
    
    res.json({
      success: true,
      message: 'Signal queue cleared'
    });
  } catch (error) {
    console.error('Clear queue error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Update processor configuration
router.put('/config', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const newConfig = req.body;
    
    processor.updateConfig(newConfig);
    
    res.json({
      success: true,
      message: 'Configuration updated'
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get queue statistics
router.get('/queue-stats', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const status = processor.getStatus();
    
    res.json({
      success: true,
      queueStats: {
        size: status.queueSize,
        activeSignals: status.activeSignals,
        isRunning: status.isRunning
      }
    });
  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Test signal endpoint (for development)
router.post('/test', async (req, res) => {
  try {
    const processor = getSignalProcessor();
    
    // Create a test signal
    const testSignal: TradingSignal = {
      id: `test_signal_${Date.now()}`,
      symbol: 'BTCUSDT',
      action: 'buy',
      confidence: 0.85,
      reasoning: 'Test signal for development',
      timeframe: 'short',
      riskLevel: 'low',
      timestamp: new Date(),
      executed: false,
      priority: SignalPriority.NORMAL
    };

    const success = await processor.submitSignal(testSignal);
    
    res.json({
      success: true,
      testSignal: testSignal,
      submitted: success,
      message: 'Test signal created'
    });
  } catch (error) {
    console.error('Test signal error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Risk Guard endpoints
router.get('/risk/status', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const riskStatus = processor.getRiskStatus();
    
    res.json({
      success: true,
      riskStatus
    });
  } catch (error) {
    console.error('Risk status error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/risk/alerts', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const alerts = processor.getRiskAlerts();
    
    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Risk alerts error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/risk/emergency-stop', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const { active } = req.body;
    
    processor.setEmergencyStop(active);
    
    res.json({
      success: true,
      message: `Emergency stop ${active ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.put('/risk/config', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const newConfig = req.body;
    
    processor.updateRiskConfig(newConfig);
    
    res.json({
      success: true,
      message: 'Risk configuration updated'
    });
  } catch (error) {
    console.error('Risk config update error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/risk/reset', (req, res) => {
  try {
    const processor = getSignalProcessor();
    
    processor.resetRiskGuard();
    
    res.json({
      success: true,
      message: 'Risk guard reset'
    });
  } catch (error) {
    console.error('Risk reset error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Feature Store endpoints
router.get('/features/history', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const { symbol, limit } = req.query;
    
    const history = processor.getSignalHistory(
      symbol as string, 
      limit ? parseInt(limit as string) : undefined
    );
    
    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Feature history error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/features/executions', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const { signalId, limit } = req.query;
    
    const executions = processor.getExecutionHistory(
      signalId as string,
      limit ? parseInt(limit as string) : undefined
    );
    
    res.json({
      success: true,
      executions,
      count: executions.length
    });
  } catch (error) {
    console.error('Feature executions error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/features/patterns/:symbol', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const { symbol } = req.params;
    
    const patterns = processor.getPatternAnalysis(symbol);
    
    res.json({
      success: true,
      patterns
    });
  } catch (error) {
    console.error('Feature patterns error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/features/performance', (req, res) => {
  try {
    const processor = getSignalProcessor();
    const { symbol } = req.query;
    
    const metrics = processor.getPerformanceMetrics(symbol as string);
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Feature performance error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/features/recommendations', async (req, res) => {
  try {
    const processor = getSignalProcessor();
    const signalData = req.body;
    
    // Create trading signal for analysis
    const signal: TradingSignal = {
      id: signalData.id || `analysis_${Date.now()}`,
      symbol: signalData.symbol,
      action: signalData.action,
      confidence: signalData.confidence,
      reasoning: signalData.reasoning || 'Analysis request',
      timeframe: signalData.timeframe || 'medium',
      riskLevel: signalData.riskLevel || 'medium',
      timestamp: new Date(),
      executed: false,
      priority: signalData.priority || SignalPriority.NORMAL
    };
    
    const recommendations = await processor.getSignalRecommendations(signal);
    
    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Feature recommendations error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/features/clear', (req, res) => {
  try {
    const processor = getSignalProcessor();
    
    processor.clearFeatureHistory();
    
    res.json({
      success: true,
      message: 'Feature history cleared'
    });
  } catch (error) {
    console.error('Feature clear error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router; 