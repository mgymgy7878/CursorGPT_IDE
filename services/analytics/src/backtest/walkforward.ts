// Walk-Forward Optimization
// Train/Validate/Test split to prevent overfitting

export type WalkForwardConfig = {
  trainRatio: number;      // e.g., 0.6 = 60% for training
  validateRatio: number;   // e.g., 0.2 = 20% for validation
  testRatio: number;       // e.g., 0.2 = 20% for test
  rollingWindow?: boolean; // If true, use rolling window approach
  step?: number;           // Step size for rolling window (e.g., 0.2 = 20%)
};

export type WalkForwardFold = {
  foldId: number;
  start: number;           // Start index in candles array
  end: number;             // End index in candles array
  train: [number, number]; // [start, end] indices for training
  validate?: [number, number]; // [start, end] indices for validation
  test: [number, number];  // [start, end] indices for testing
};

export type BacktestMetrics = {
  sharpe: number;
  winRate: number;
  ddMax: number;
  pnl: number;
  trades: number;
};

export type WalkForwardResult = {
  folds: number;
  overfitting: {
    detected: boolean;
    ratio: number;         // test_sharpe / train_sharpe
    threshold: number;     // Detection threshold (default: 0.6)
  };
  summary: {
    train: BacktestMetrics;
    validate?: BacktestMetrics;
    test: BacktestMetrics;
  };
  foldDetails: Array<{
    foldId: number;
    train: BacktestMetrics;
    validate?: BacktestMetrics;
    test: BacktestMetrics;
  }>;
};

/**
 * Build walk-forward folds based on config
 */
export function buildFolds(candleCount: number, cfg: WalkForwardConfig): WalkForwardFold[] {
  const folds: WalkForwardFold[] = [];
  
  if (!cfg.rollingWindow) {
    // Single fold: fixed train/validate/test split
    const trainEnd = Math.floor(candleCount * cfg.trainRatio);
    const validateEnd = cfg.validateRatio > 0 
      ? Math.floor(candleCount * (cfg.trainRatio + cfg.validateRatio))
      : trainEnd;
    
    folds.push({
      foldId: 0,
      start: 0,
      end: candleCount - 1,
      train: [0, trainEnd - 1],
      validate: cfg.validateRatio > 0 ? [trainEnd, validateEnd - 1] : undefined,
      test: [validateEnd, candleCount - 1],
    });
  } else {
    // Rolling window approach
    const step = cfg.step || 0.2;
    const windowSize = Math.floor(candleCount * (cfg.trainRatio + cfg.validateRatio + cfg.testRatio));
    const stepSize = Math.floor(candleCount * step);
    
    let foldId = 0;
    for (let start = 0; start + windowSize <= candleCount; start += stepSize) {
      const end = start + windowSize - 1;
      const trainEnd = start + Math.floor(windowSize * cfg.trainRatio);
      const validateEnd = cfg.validateRatio > 0
        ? start + Math.floor(windowSize * (cfg.trainRatio + cfg.validateRatio))
        : trainEnd;
      
      folds.push({
        foldId: foldId++,
        start,
        end,
        train: [start, trainEnd - 1],
        validate: cfg.validateRatio > 0 ? [trainEnd, validateEnd - 1] : undefined,
        test: [validateEnd, end],
      });
    }
  }
  
  return folds;
}

/**
 * Run walk-forward optimization with provided backtest engine
 */
export async function runWalkForward<T>(
  candles: any[],
  backtestFn: (bars: any[], config: T) => BacktestMetrics,
  strategyConfig: T,
  wfConfig: WalkForwardConfig
): Promise<WalkForwardResult> {
  const folds = buildFolds(candles.length, wfConfig);
  const foldResults: Array<{
    foldId: number;
    train: BacktestMetrics;
    validate?: BacktestMetrics;
    test: BacktestMetrics;
  }> = [];
  
  // Aggregate metrics
  const trainMetrics: BacktestMetrics[] = [];
  const validateMetrics: BacktestMetrics[] = [];
  const testMetrics: BacktestMetrics[] = [];
  
  // Run each fold
  for (const fold of folds) {
    // Train segment
    const trainBars = candles.slice(fold.train[0], fold.train[1] + 1);
    const trainResult = backtestFn(trainBars, strategyConfig);
    trainMetrics.push(trainResult);
    
    // Validate segment (if exists)
    let validateResult: BacktestMetrics | undefined;
    if (fold.validate) {
      const validateBars = candles.slice(fold.validate[0], fold.validate[1] + 1);
      validateResult = backtestFn(validateBars, strategyConfig);
      validateMetrics.push(validateResult);
    }
    
    // Test segment
    const testBars = candles.slice(fold.test[0], fold.test[1] + 1);
    const testResult = backtestFn(testBars, strategyConfig);
    testMetrics.push(testResult);
    
    foldResults.push({
      foldId: fold.foldId,
      train: trainResult,
      validate: validateResult,
      test: testResult,
    });
  }
  
  // Calculate averages
  const avgTrain = averageMetrics(trainMetrics);
  const avgValidate = validateMetrics.length > 0 ? averageMetrics(validateMetrics) : undefined;
  const avgTest = averageMetrics(testMetrics);
  
  // Overfitting detection
  const sharpeRatio = avgTest.sharpe / (avgTrain.sharpe || 1);
  const overfittingThreshold = 0.6;
  const overfittingDetected = sharpeRatio < overfittingThreshold;
  
  return {
    folds: folds.length,
    overfitting: {
      detected: overfittingDetected,
      ratio: sharpeRatio,
      threshold: overfittingThreshold,
    },
    summary: {
      train: avgTrain,
      validate: avgValidate,
      test: avgTest,
    },
    foldDetails: foldResults,
  };
}

/**
 * Calculate average metrics across multiple folds
 */
function averageMetrics(metrics: BacktestMetrics[]): BacktestMetrics {
  if (metrics.length === 0) {
    return { sharpe: 0, winRate: 0, ddMax: 0, pnl: 0, trades: 0 };
  }
  
  const sum = metrics.reduce(
    (acc, m) => ({
      sharpe: acc.sharpe + m.sharpe,
      winRate: acc.winRate + m.winRate,
      ddMax: acc.ddMax + m.ddMax,
      pnl: acc.pnl + m.pnl,
      trades: acc.trades + m.trades,
    }),
    { sharpe: 0, winRate: 0, ddMax: 0, pnl: 0, trades: 0 }
  );
  
  return {
    sharpe: sum.sharpe / metrics.length,
    winRate: sum.winRate / metrics.length,
    ddMax: sum.ddMax / metrics.length,
    pnl: sum.pnl / metrics.length,
    trades: Math.round(sum.trades / metrics.length),
  };
}

