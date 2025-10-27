import { EventEmitter } from 'events';
import { prometheus } from './metrics.js';

export class OptimizationRunner extends EventEmitter {
  private strategy: string;
  private paramSpace: any;
  private maxEvaluations: number;
  private earlyStopPlateau: number;
  private isRunning = false;
  private currentEvaluation = 0;
  private bestScore = -Infinity;
  private plateauCount = 0;

  constructor(
    strategy: string,
    paramSpace: any,
    options: {
      maxEvaluations?: number;
      earlyStopPlateau?: number;
    } = {}
  ) {
    super();
    this.strategy = strategy;
    this.paramSpace = paramSpace;
    this.maxEvaluations = options.maxEvaluations || 1000;
    this.earlyStopPlateau = options.earlyStopPlateau || 10;
  }

  async run() {
    if (this.isRunning) {
      throw new Error('Optimization runner is already running');
    }

    this.isRunning = true;
    this.currentEvaluation = 0;
    this.bestScore = -Infinity;
    this.plateauCount = 0;

    const startTime = Date.now();
    
    try {
      // Bayesian optimization loop
      while (this.currentEvaluation < this.maxEvaluations && this.isRunning) {
        const params = this.sampleParameters();
        const score = await this.evaluateParameters(params);
        
        this.currentEvaluation++;
        this.updateBestScore(score);
        
        this.emit('evaluation', {
          evaluation: this.currentEvaluation,
          params,
          score,
          bestScore: this.bestScore
        });
        
        // Check for early stopping
        if (this.shouldEarlyStop()) {
          this.emit('earlyStop', {
            reason: 'plateau',
            evaluation: this.currentEvaluation,
            bestScore: this.bestScore
          });
          break;
        }
      }
      
      const runtime = Date.now() - startTime;
      prometheus.optRuntimeMs.observe({ strategy: this.strategy }, runtime);
      prometheus.optRunsTotal.inc({ strategy: this.strategy, status: 'completed' });
      
      this.emit('completed', {
        totalEvaluations: this.currentEvaluation,
        bestScore: this.bestScore,
        runtime
      });
      
    } catch (error) {
      prometheus.optRunsTotal.inc({ strategy: this.strategy, status: 'error' });
      this.emit('error', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private sampleParameters(): any {
    // Bayesian optimization parameter sampling
    // This would implement the actual Bayesian optimization algorithm
    const params: any = {};
    
    for (const [key, range] of Object.entries(this.paramSpace)) {
      if (Array.isArray(range) && range.length === 2) {
        const [min, max] = range;
        params[key] = Math.random() * (max - min) + min;
      }
    }
    
    return params;
  }

  private async evaluateParameters(params: any): Promise<number> {
    // Evaluate parameters using the strategy
    // This would call the actual backtest engine
    const startTime = Date.now();
    
    try {
      // Mock evaluation - replace with actual backtest
      const score = Math.random() * 2 - 1; // Random score between -1 and 1
      
      const evaluationTime = Date.now() - startTime;
      prometheus.optEvalsTotal.inc({ strategy: this.strategy });
      
      return score;
      
    } catch (error) {
      this.emit('evaluationError', { params, error });
      throw error;
    }
  }

  private updateBestScore(score: number) {
    if (score > this.bestScore) {
      this.bestScore = score;
      this.plateauCount = 0;
      prometheus.optBestSharpe.set({ strategy: this.strategy }, score);
    } else {
      this.plateauCount++;
    }
  }

  private shouldEarlyStop(): boolean {
    return this.plateauCount >= this.earlyStopPlateau;
  }

  stop() {
    this.isRunning = false;
    this.emit('stopped');
  }
}
