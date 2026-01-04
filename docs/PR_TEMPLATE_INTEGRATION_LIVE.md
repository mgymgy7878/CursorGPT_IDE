# Integration: Live Charts + Copilot + Real Engine Optimization

**Dev:** web-next port 3003
**Evidence:** Çıktılar `evidence/` klasörüne yazılır

## Summary

This PR completes the integration between UI and engine adapter, adds live chart data support, connects Copilot to executor service, and implements real engine optimization with parameter sweep.

## Key Changes

### Engine-UI Integration
- **Optimize API**: Real engine integration with klines support
- **Real Engine Adapter**: Param sweep optimization with actual backtests
- **Engine Adapter Interface**: OptimizeInput extended with klines field

### Copilot Integration
- **Strategy Generation**: Executor service integration with fallback
- **Timeout Handling**: 30s timeout for AI generation
- **Error Handling**: Graceful fallback to mock suggestions

### Live Chart Data
- **Technical Analysis**: PriceChartLC with live data support
- **Real-time Updates**: EventSource (SSE) streaming
- **Overlay Support**: Fibonacci and Bollinger Bands

## Testing

### Real Engine Mode
```powershell
$env:SPARK_ENGINE_MODE="real"
$env:SPARK_ENGINE_REAL_ENABLE="1"
pnpm --filter web-next dev
```

### Copilot Strategy Generation
1. Navigate to Strategy Lab
2. Click "Generate Strategy"
3. Verify executor service connection (or fallback to mock)

### Live Charts
1. Navigate to Technical Analysis page
2. Load chart data
3. Verify live data streaming (EventSource)

## Breaking Changes
None. All changes are backward compatible.

## Files Changed
- `apps/web-next/src/app/api/optimize/run/route.ts` - Real engine integration
- `apps/web-next/src/lib/engines/engineAdapter.ts` - OptimizeInput interface
- `apps/web-next/src/lib/engines/realEngineAdapter.ts` - Param sweep optimization
- `apps/web-next/src/app/api/copilot/strategy/generate/route.ts` - Executor integration
- `apps/web-next/src/app/technical-analysis/page.tsx` - Live chart support

## Reviewer Checklist
- [ ] Optimize API works with real engine mode
- [ ] Copilot connects to executor service (or falls back gracefully)
- [ ] Live charts update in real-time
- [ ] All typecheck errors resolved

