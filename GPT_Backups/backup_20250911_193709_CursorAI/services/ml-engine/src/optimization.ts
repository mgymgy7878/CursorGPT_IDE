// ML Engine Optimization - Parameter generation and optimization strategies
import { evaluateTrial } from "./score";

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

// Bayesian optimization (simplified)
export function generateBayesianParams(bounds: Record<string, { min: number; max: number }>, history: Array<{ params: Record<string, any>; score: number }>): Record<string, any> {
  // Simple implementation: use history to avoid previously bad regions
  const params: Record<string, any> = {};
  
  for (const [paramName, { min, max }] of Object.entries(bounds)) {
    // Find the best score in history
    const bestScore = Math.max(...history.map(h => h.score), 0);
    const bestParams = history.find(h => h.score === bestScore)?.params;
    
    if (bestParams && bestParams[paramName] !== undefined) {
      // Perturb around the best parameter with some randomness
      const perturbation = (Math.random() - 0.5) * 0.2; // ±10% perturbation
      params[paramName] = Math.max(min, Math.min(max, bestParams[paramName] * (1 + perturbation)));
    } else {
      // Fallback to random if no history
      params[paramName] = min + Math.random() * (max - min);
    }
  }
  
  return params;
}

// Hyperparameter optimization strategies
export type OptimizationStrategy = 'grid' | 'random' | 'bayesian';

export function generateParams(
  strategy: OptimizationStrategy,
  bounds: Record<string, { min: number; max: number }>,
  options: {
    steps?: number;
    history?: Array<{ params: Record<string, any>; score: number }>;
  } = {}
): Record<string, any> | Record<string, any>[] {
  switch (strategy) {
    case 'grid':
      return generateGridParams(bounds, options.steps || 5);
    case 'random':
      return generateRandomParams(bounds);
    case 'bayesian':
      return generateBayesianParams(bounds, options.history || []);
    default:
      return generateRandomParams(bounds);
  }
}

// Optimization runner
export async function runOptimization(
  bounds: Record<string, { min: number; max: number }>,
  budget: number,
  strategy: OptimizationStrategy = 'random'
): Promise<Array<{ params: Record<string, any>; score: number }>> {
  const results: Array<{ params: Record<string, any>; score: number }> = [];
  
  for (let i = 0; i < budget; i++) {
    const params = generateParams(strategy, bounds, { history: results });
    
    // Evaluate the parameters
    const mockTrial = { 
      id: `trial_${i}`, 
      experiment_id: 'opt', 
      params, 
      status: 'pending' as const,
      created_at: new Date().toISOString()
    };
    const { score } = await evaluateTrial(mockTrial);
    
    results.push({ params, score });
    
    console.log(`Optimization step ${i + 1}/${budget}: score = ${score.toFixed(2)}`);
  }
  
  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);
  
  return results;
} 