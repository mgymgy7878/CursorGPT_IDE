---
name: P0 - Backtest Engine
about: Implement historical backtesting with metrics calculation
labels: P0, backend, analytics
milestone: v1.4.0
---

## 🎯 Objective

Build production-quality backtest engine for strategy validation with realistic execution simulation and comprehensive metrics.

## 📋 Acceptance Criteria

- [ ] Historical data loader (OHLCV from exchanges)
- [ ] Event-driven simulation engine
- [ ] Realistic execution model (slippage, commission)
- [ ] Metrics calculation (Sharpe, maxDD, CAGR, PF, win rate)
- [ ] Job queue for async execution
- [ ] Results persistence to database
- [ ] API endpoints operational
- [ ] Unit tests (70%+ coverage)
- [ ] Validation against known strategies

## 🏗️ Implementation Plan

### Core Components

**1. Data Loader**
- Fetch historical OHLCV from Binance/BTCTurk
- Cache data locally
- Handle missing data
- Normalize across exchanges

**2. Simulation Engine**
- Event loop (candle-by-candle)
- Strategy execution
- Position management
- Order filling simulation

**3. Metrics Calculator**
- Total return, CAGR
- Sharpe ratio, Sortino ratio
- Maximum drawdown
- Win rate, profit factor
- Trade statistics

**4. Job System**
- Queue management
- Progress tracking
- Cancellation support

### Tasks

1. **Data Loader** (8 hours)
   - Binance klines API
   - BTCTurk OHLCV API
   - Caching layer
   - Data validation

2. **Simulation Engine** (12 hours)
   - Event loop
   - Strategy compiler (safe sandbox)
   - Position tracking
   - Order execution simulation
   - Slippage model
   - Commission calculation

3. **Metrics** (6 hours)
   - Returns calculation
   - Risk metrics
   - Trade statistics
   - Equity curve generation

4. **Job Queue** (4 hours)
   - Job creation
   - Status tracking
   - Progress updates
   - Results storage

5. **API Endpoints** (4 hours)
   - POST `/api/backtest/run`
   - GET `/api/backtest/:id`
   - GET `/api/backtest/:id/results`

6. **Testing** (8 hours)
   - Unit tests
   - Integration tests
   - Validation tests

## 🔍 Definition of Done

- [ ] All acceptance criteria met
- [ ] 70%+ test coverage
- [ ] Can backtest sample strategies
- [ ] Metrics match manual calculations
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Merged to main

## ⏱️ Estimated Time

**Total:** 42 hours (~5-6 days)

## 📚 References

- [Backtest Basics](https://www.quantstart.com/articles/Backtesting-Systematic-Trading-Strategies-in-Python/)
- Action Plan: [EYLEM_PLANI_HEMEN_BASLAT_2025_10_24.md](../../EYLEM_PLANI_HEMEN_BASLAT_2025_10_24.md)

## 🔗 Dependencies

- #1 - Database Layer (MUST be complete first)

## 🎯 Success Metrics

- Backtest completes in < 10s for 1 year hourly data
- Metrics accurate within 0.1%
- No false positives on validation tests

