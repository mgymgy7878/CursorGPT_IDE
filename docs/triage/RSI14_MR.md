# RSI14_MR Triage Report - RED

## Summary
**Status**: ERROR/RED  
**Date**: 2025-08-20T28:15:00Z  
**NONCE**: 20250820-281000-147258  

## Failure Analysis

### Threshold Violations
- **Fragility Top**: 0.55 < 0.60 (target) ❌
- **OOS Positive Ratio**: 0.40 < 0.60 (target) ❌

### Performance Metrics
- **Robust Base**: 8 combinations Sharpe>1 (target ≥4) ✅
- **Compute Time**: 304ms (target ≤3000ms) ✅
- **Best Candidate**: oversold=10, overbought=75
  - Sharpe: 9.42
  - CAGR: 8.01%
  - MaxDD: 0.41%
  - Fragility Score: 0.55

## Root Cause
RSI14_MR strategy shows high Sharpe ratios but fails under stress testing:
1. **Fragility**: Strategy breaks down under cost/noise stress (0.55 < 0.60)
2. **OOS Stability**: Poor out-of-sample performance (0.40 < 0.60)
3. **Overfitting**: High in-sample performance doesn't translate to robustness

## Decision
**RSI14_MR → DENYLIST**  
Strategy deprecated due to instability under real-world conditions.

## Next Steps
1. Move to EMA_50_200 triage
2. If EMA_50_200 fails, consider MACD_RSI_fusion
3. Document lessons learned for future strategy development 