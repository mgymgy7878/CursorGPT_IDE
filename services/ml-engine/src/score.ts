// ML Engine Scoring Function
import type { Trial } from "./types";

// Mock scoring function (replace with actual backtest/strategy evaluation)
export function evaluateTrial(trial: Trial): Promise<{ score: number; metrics: Record<string, any> }> {
  return new Promise((resolve) => {
    // Simulate evaluation time
    setTimeout(() => {
      const params = trial.params;
      
      // Mock scoring based on parameters
      let score = 0;
      const metrics: Record<string, any> = {};
      
      // Example: moving average strategy scoring
      if (params.shortWindow && params.longWindow) {
        const ratio = params.shortWindow / params.longWindow;
        score = Math.max(0, 100 - Math.abs(ratio - 0.5) * 200); // Optimal ratio around 0.5
        
        metrics.sharpe_ratio = score / 100 * 2.5;
        metrics.max_drawdown = Math.max(0, 20 - score / 5);
        metrics.total_return = score / 100 * 150;
        metrics.win_rate = 0.5 + (score / 100) * 0.3;
      }
      
      // Add some randomness
      score += (Math.random() - 0.5) * 10;
      score = Math.max(0, Math.min(100, score));
      
      console.log(`Trial ${trial.id} evaluated: score=${score.toFixed(2)}`);
      
      resolve({ score, metrics });
    }, 1000 + Math.random() * 2000); // 1-3 seconds
  });
}

// Grid search parameter generator
export function generateGridParams(bounds: Record<string, { min: number; max: number }>, steps: number = 5): Record<string, any>[] {
  const params: Record<string, any>[] = [];
  const paramNames = Object.keys(bounds);
  
  function generateCombinations(index: number, current: Record<string, any>) {
    if (index === paramNames.length) {
      params.push({ ...current });
      return;
    }
    
    const paramName = paramNames[index];
    if (!paramName) return;
    
    const bound = bounds[paramName];
    if (!bound) return;
    
    const { min, max } = bound;
    const step = (max - min) / (steps - 1);
    
    for (let i = 0; i < steps; i++) {
      current[paramName] = min + i * step;
      generateCombinations(index + 1, current);
    }
  }
  
  generateCombinations(0, {});
  return params;
}

// Random search parameter generator
export function generateRandomParams(bounds: Record<string, { min: number; max: number }>): Record<string, any> {
  const params: Record<string, any> = {};
  
  for (const [paramName, { min, max }] of Object.entries(bounds)) {
    params[paramName] = min + Math.random() * (max - min);
  }
  
  return params;
} 