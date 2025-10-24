---
name: P0 - BIST Real-Time Feed
about: Integrate BIST market data with real-time updates
labels: P0, backend, market-data
milestone: v1.4.0
---

## 🎯 Objective

Integrate BIST (Borsa Istanbul) real-time market data feed with rate limiting and symbol mapping.

## 📋 Acceptance Criteria

- [ ] BIST data provider researched and selected
- [ ] REST/WebSocket integration implemented
- [ ] Rate limiting configured (BIST API limits)
- [ ] Symbol mapping (THYAO, AKBNK, etc.)
- [ ] Real-time price updates
- [ ] Error handling and fallback
- [ ] Data quality validation
- [ ] Staleness monitoring
- [ ] API endpoints operational
- [ ] Unit tests (70%+ coverage)

## 🏗️ Implementation Plan

### Research Phase (1 day)

1. **Provider Selection**
   - BIST official API (if available)
   - Licensed data providers
   - Free alternatives
   - Cost analysis

2. **API Documentation**
   - Authentication method
   - Rate limits
   - Data format
   - Update frequency

### Implementation Phase (2-3 days)

**1. Provider Client** (6 hours)
- HTTP client with auth
- WebSocket client (if available)
- Rate limiter
- Retry logic

**2. Data Normalization** (4 hours)
- Symbol mapping
- Price normalization
- Timestamp handling
- Data validation

**3. Integration** (4 hours)
- Marketdata service integration
- WebSocket aggregation
- Store updates
- Frontend display

**4. Monitoring** (2 hours)
- Staleness tracking
- Error metrics
- Data quality checks

**5. Testing** (4 hours)
- Unit tests
- Integration tests
- Mock provider

## 🔍 Definition of Done

- [ ] All acceptance criteria met
- [ ] 70%+ test coverage
- [ ] Real-time updates working
- [ ] Staleness < 30s
- [ ] Error rate < 1%
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Merged to main

## ⏱️ Estimated Time

**Research:** 8 hours (1 day)  
**Implementation:** 20 hours (2-3 days)  
**Total:** 28 hours (~4 days)

## 📚 References

- [BIST Website](https://www.borsaistanbul.com/)
- [Market Data Providers](https://www.borsaistanbul.com/en/data/data-vendors)
- Project Analysis: [DETAYLI_PROJE_ANALIZ_2025_10_24.md](../../DETAYLI_PROJE_ANALIZ_2025_10_24.md)

## 🔗 Dependencies

- None (can be done in parallel with other P0 items)

## ⚠️ Risks

- **Licensing:** BIST data may require paid license
- **Rate Limits:** Free tiers may be restrictive
- **Regulatory:** SPK compliance may be required

## 💡 Alternatives

- Mock data for initial development
- Delayed real-time (5-15 minute delay)
- Limited symbol set (top 10 stocks)

