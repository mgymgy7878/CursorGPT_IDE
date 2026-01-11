/**
 * Engine Metrics - Definitions and calculations
 *
 * Metrik tanımları ve hesaplama yöntemleri.
 * Birim ve varsayımlar netleştirildi.
 */

/**
 * Sharpe Ratio Calculation
 *
 * Formula: (Average Return - Risk-Free Rate) / Standard Deviation of Returns
 *
 * Varsayımlar:
 * - Risk-free rate = 0 (basitlik için)
 * - Returns: per-trade percentage returns
 * - Standard deviation: per-trade returns'ün standart sapması
 *
 * Birim: Dimensionless (ratio)
 */
export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): number {
  if (returns.length === 0) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;
  return (avgReturn - riskFreeRate) / stdDev;
}

/**
 * Max Drawdown Calculation
 *
 * Formula: Maximum peak-to-trough decline during the period
 *
 * Varsayımlar:
 * - Equity curve: Starting equity + cumulative returns
 * - Peak: Highest equity point
 * - Drawdown: (Current Equity - Peak) / Peak * 100
 *
 * Birim: Percentage (negative value)
 */
export function calculateMaxDrawdown(returns: number[]): number {
  let maxDD = 0;
  let peak = 100; // Starting equity (100%)
  let equity = 100;

  for (const ret of returns) {
    equity = equity * (1 + ret / 100); // Cumulative return
    if (equity > peak) peak = equity;
    const dd = ((equity - peak) / peak) * 100;
    if (dd < maxDD) maxDD = dd;
  }

  return maxDD;
}

/**
 * Total Return Calculation
 *
 * Formula: Sum of all trade returns
 *
 * Varsayımlar:
 * - Returns: per-trade percentage returns
 * - Simple sum (not compounded)
 *
 * Birim: Percentage
 */
export function calculateTotalReturn(returns: number[]): number {
  return returns.reduce((sum, r) => sum + r, 0);
}

