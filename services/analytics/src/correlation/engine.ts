// services/analytics/src/correlation/engine.ts
// Correlation Engine - Rolling correlation, beta, lead/lag analysis

export interface Tick {
  timestamp: number;
  symbol: string;
  price: number;
}

export interface CorrEdge {
  leader: string;
  follower: string;
  rho: number;        // Pearson correlation
  beta: number;       // Beta coefficient
  lag: number;        // Optimal lag (bars)
  n: number;          // Sample size
  pValue: number;     // Statistical significance
}

export interface ReturnData {
  symbol: string;
  returns: number[];
  timestamps: number[];
}

/**
 * Correlation Engine
 * Calculates rolling correlations, betas, and lead-lag relationships
 */
export class CorrEngine {
  private tickBuffer: Map<string, Tick[]> = new Map();
  private returnBuffer: Map<string, ReturnData> = new Map();
  
  constructor(
    private windowSeconds: number = 900, // 15 minutes
    private lagMax: number = 3           // Max lag to search
  ) {
    console.log('[CorrEngine] Initialized', { windowSeconds, lagMax });
  }

  /**
   * Push new tick to engine
   */
  push(tick: Tick): void {
    // Get or create buffer
    const buffer = this.tickBuffer.get(tick.symbol) || [];
    buffer.push(tick);

    // Keep only window worth of data
    const cutoff = tick.timestamp - this.windowSeconds * 1000;
    const filtered = buffer.filter(t => t.timestamp >= cutoff);
    
    this.tickBuffer.set(tick.symbol, filtered);

    // Calculate returns
    this.updateReturns(tick.symbol, filtered);
  }

  /**
   * Update returns buffer for a symbol
   */
  private updateReturns(symbol: string, ticks: Tick[]): void {
    if (ticks.length < 2) return;

    const returns: number[] = [];
    const timestamps: number[] = [];

    for (let i = 1; i < ticks.length; i++) {
      const ret = (ticks[i].price - ticks[i - 1].price) / ticks[i - 1].price;
      returns.push(ret);
      timestamps.push(ticks[i].timestamp);
    }

    this.returnBuffer.set(symbol, { symbol, returns, timestamps });
  }

  /**
   * Compute correlation matrix for given symbols
   */
  computeMatrix(symbols: string[]): CorrEdge[] {
    const edges: CorrEdge[] = [];

    for (const leader of symbols) {
      for (const follower of symbols) {
        if (leader === follower) continue;

        const edge = this.computeEdge(leader, follower);
        if (edge) {
          edges.push(edge);
        }
      }
    }

    return edges;
  }

  /**
   * Compute correlation edge between two symbols
   */
  private computeEdge(leader: string, follower: string): CorrEdge | null {
    const leaderData = this.returnBuffer.get(leader);
    const followerData = this.returnBuffer.get(follower);

    if (!leaderData || !followerData) return null;
    if (leaderData.returns.length < 10 || followerData.returns.length < 10) return null;

    // Align data (use shorter length)
    const n = Math.min(leaderData.returns.length, followerData.returns.length);
    const leaderReturns = leaderData.returns.slice(-n);
    const followerReturns = followerData.returns.slice(-n);

    // Calculate Pearson correlation
    const rho = this.pearsonCorrelation(leaderReturns, followerReturns);

    // Calculate beta
    const beta = this.calculateBeta(leaderReturns, followerReturns);

    // Find optimal lag
    const lag = this.findOptimalLag(leaderReturns, followerReturns);

    // Calculate p-value (simplified)
    const pValue = this.calculatePValue(rho, n);

    return {
      leader,
      follower,
      rho,
      beta,
      lag,
      n,
      pValue,
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    if (denX === 0 || denY === 0) return 0;

    return num / Math.sqrt(denX * denY);
  }

  /**
   * Calculate beta coefficient (follower vs leader)
   */
  private calculateBeta(leaderReturns: number[], followerReturns: number[]): number {
    const n = leaderReturns.length;
    if (n === 0) return 0;

    const meanLeader = leaderReturns.reduce((a, b) => a + b, 0) / n;
    const meanFollower = followerReturns.reduce((a, b) => a + b, 0) / n;

    let cov = 0;
    let varLeader = 0;

    for (let i = 0; i < n; i++) {
      const dLeader = leaderReturns[i] - meanLeader;
      const dFollower = followerReturns[i] - meanFollower;
      cov += dLeader * dFollower;
      varLeader += dLeader * dLeader;
    }

    if (varLeader === 0) return 0;

    return cov / varLeader;
  }

  /**
   * Find optimal lag using cross-correlation
   */
  private findOptimalLag(leaderReturns: number[], followerReturns: number[]): number {
    let maxCorr = -1;
    let optimalLag = 0;

    for (let lag = 0; lag <= this.lagMax; lag++) {
      if (lag >= followerReturns.length) break;

      const shiftedFollower = followerReturns.slice(lag);
      const alignedLeader = leaderReturns.slice(0, shiftedFollower.length);

      const corr = Math.abs(this.pearsonCorrelation(alignedLeader, shiftedFollower));

      if (corr > maxCorr) {
        maxCorr = corr;
        optimalLag = lag;
      }
    }

    return optimalLag;
  }

  /**
   * Calculate p-value (simplified)
   */
  private calculatePValue(rho: number, n: number): number {
    if (n < 3) return 1.0;

    // t-statistic for correlation
    const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
    
    // Simplified p-value approximation
    return Math.exp(-Math.abs(t));
  }

  /**
   * Get leaders for a follower symbol
   */
  getLeaders(follower: string, edges: CorrEdge[]): CorrEdge[] {
    return edges
      .filter(e => e.follower === follower)
      .sort((a, b) => {
        // Sort by correlation strength, then lag
        if (Math.abs(b.rho) !== Math.abs(a.rho)) {
          return Math.abs(b.rho) - Math.abs(a.rho);
        }
        return a.lag - b.lag;
      })
      .slice(0, 5); // Top 5 leaders
  }

  /**
   * Calculate z-score for a symbol's recent return
   */
  calculateZScore(symbol: string, periods: number = 20): number {
    const data = this.returnBuffer.get(symbol);
    if (!data || data.returns.length < periods) return 0;

    const recent = data.returns.slice(-periods);
    const mean = recent.reduce((a, b) => a + b, 0) / periods;
    const variance = recent.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / periods;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const latestReturn = data.returns[data.returns.length - 1];
    return (latestReturn - mean) / stdDev;
  }
}

