# BIST Real Feed Transition - Risk Analysis & Validation Checklist
**Spark Trading Platform - v1.3**

**Document Version:** 1.0  
**Date:** 2025-01-16  
**Status:** 📋 PRE-IMPLEMENTATION  
**Owner:** Data Operations Team

---

## 🎯 Executive Summary

### Objective
Transition from mock BIST (Borsa Istanbul) data to real vendor feed with comprehensive quality gates, fallback mechanisms, and validation processes to ensure reliable Turkish equity market data.

### Current State
- **Data Source:** Mock data generator
- **Symbols:** THYAO, AKBNK (limited coverage)
- **Staleness:** Always 0s (artificial)
- **Quality:** 100% (no real-world issues)

### Target State
- **Data Source:** Real BIST vendor (TBD)
- **Symbols:** THYAO, AKBNK, GARAN, ISCTR, SAHOL (top 5)
- **Staleness:** <30s SLO, <20s target
- **Quality:** >99.9% with automated gates

### Risk Level
**MEDIUM-HIGH** - Real vendor integration with mission-critical fallback requirements

---

## 🔍 Risk Assessment Matrix

| Risk Category | Likelihood | Impact | Overall | Mitigation Priority |
|--------------|------------|--------|---------|---------------------|
| Vendor API Downtime | Medium | High | **HIGH** | P0 |
| Data Quality Issues | Medium | Medium | **MEDIUM** | P1 |
| Latency Degradation | Low | Medium | **LOW** | P2 |
| Cost Overruns | Low | Low | **LOW** | P3 |
| Schema Incompatibility | Medium | High | **HIGH** | P0 |

---

## 🚨 Critical Risks (P0)

### Risk 1: Vendor API Downtime
**Description:** BIST vendor API becomes unavailable, causing market data loss.

**Likelihood:** Medium (assume 99.5% uptime = ~43 minutes downtime/month)

**Impact:** High
- Trading strategies cannot execute
- UI shows stale/missing data
- Potential financial losses if positions can't be closed

**Mitigation Strategies:**
1. **Mock Fallback (Auto):** System automatically falls back to mock data if vendor unavailable for >30s
2. **Multi-Vendor Strategy:** Evaluate 2-3 vendors, maintain backup vendor integration
3. **Circuit Breaker:** After 3 consecutive failures, disable vendor for 5 minutes, retry with exponential backoff
4. **Alert Escalation:** Critical alert to ops team within 30 seconds of vendor failure
5. **Graceful Degradation:** UI shows "⚠️ Using backup data" banner when in fallback mode

**Acceptance Criteria:**
- [ ] Fallback to mock triggered within 30 seconds of vendor failure
- [ ] Alert sent to ops team within 30 seconds
- [ ] UI displays fallback status clearly
- [ ] Automatic recovery when vendor returns
- [ ] No trading strategy crashes during vendor outage

**Testing:**
- Simulate vendor downtime for 1-10 minutes
- Verify mock fallback activation
- Verify automatic recovery
- Load test during fallback mode

---

### Risk 2: Schema Incompatibility
**Description:** Vendor data format differs from expected schema, causing parsing errors.

**Likelihood:** Medium (vendor API may change without notice)

**Impact:** High
- Data parsing failures
- Incorrect strategy decisions
- Potential trading losses

**Mitigation Strategies:**
1. **Strict Schema Validation:** Validate every incoming message against expected schema
2. **Schema Versioning:** Support multiple schema versions with automatic detection
3. **Defensive Parsing:** Never crash on unexpected fields, log warnings
4. **Contract Testing:** Automated tests against vendor's published schema
5. **Canary Validation:** Side-by-side comparison with mock data during rollout

**Acceptance Criteria:**
- [ ] Schema validation rejects invalid data with clear error message
- [ ] System falls back to mock if schema validation fails >3 consecutive times
- [ ] All expected fields present in vendor data
- [ ] Optional fields handled gracefully
- [ ] Vendor schema changes detected within 1 hour

**Testing:**
- Send malformed data to parser
- Remove required fields, verify rejection
- Add extra fields, verify graceful handling
- Simulate schema version change

---

## ⚠️ High Risks (P1)

### Risk 3: Data Quality Issues
**Description:** Vendor provides incorrect data (stale prices, missing volume, zero values).

**Likelihood:** Medium (vendor APIs can have bugs or data feed issues)

**Impact:** Medium
- Incorrect trading signals
- Strategy performance degradation
- User trust erosion

**Mitigation Strategies:**
1. **Quality Gates Framework:**
   - Staleness check: reject data older than 30s
   - Sanity check: reject prices that differ >10% from previous tick without explanation
   - Volume check: reject zero-volume ticks during trading hours
   - Timestamp validation: reject future timestamps or timestamps >1 hour old
2. **Anomaly Detection:**
   - Track P50/P95/P99 for price changes, flag outliers
   - Alert on sudden volume spikes (>5x average)
3. **Side-by-Side Validation:**
   - During canary, compare real vs mock data distributions
   - Flag anomalies for manual review
4. **Audit Trail:**
   - Log all quality gate violations to `bist_quality_audit.log`
   - Daily quality report with pass/fail rates per gate

**Acceptance Criteria:**
- [ ] Staleness check rejects data >30s old
- [ ] Price anomaly detection flags >10% changes
- [ ] Volume sanity check rejects suspicious values
- [ ] Quality gate pass rate >99.9%
- [ ] Audit log captures all violations

**Testing:**
- Inject stale data (timestamp 1 hour old)
- Inject price spike (100% increase)
- Inject zero volume during trading hours
- Verify all gates reject invalid data

---

### Risk 4: Latency Degradation
**Description:** Vendor API latency exceeds SLO targets, slowing down trading decisions.

**Likelihood:** Low (most vendor APIs are optimized for low latency)

**Impact:** Medium
- Delayed strategy execution
- Missed trading opportunities
- SLO breaches

**Mitigation Strategies:**
1. **Latency Monitoring:**
   - Track P50/P95/P99 latency for vendor API calls
   - Alert if P95 latency >500ms (REST) or >100ms (WebSocket)
2. **Timeout Configuration:**
   - Set aggressive timeout (3s for REST, 10s for WS initial connect)
   - Fall back to mock if timeout exceeded
3. **Caching:**
   - Cache recent ticks (last 60s) to serve stale data if vendor slow
   - Prefer stale data over no data, with clear staleness indicator
4. **Connection Pooling:**
   - Maintain persistent WebSocket connection
   - Use HTTP/2 connection pooling for REST
5. **Geographic Optimization:**
   - Choose vendor with servers in Turkey or nearby regions

**Acceptance Criteria:**
- [ ] P95 latency <500ms for REST calls
- [ ] P95 latency <100ms for WebSocket messages
- [ ] Timeout triggers fallback within 3 seconds
- [ ] Cached data served if vendor slow
- [ ] Latency metrics exported to Prometheus

**Testing:**
- Simulate slow vendor responses (500ms, 1s, 3s)
- Verify timeout and fallback behavior
- Load test with 100 req/min

---

## 📋 Vendor Selection Criteria

### Must-Have Requirements
- [ ] **Uptime SLA:** >99.5% (max 43 min downtime/month)
- [ ] **Latency SLA:** P95 <500ms for REST, <100ms for WebSocket
- [ ] **Symbol Coverage:** THYAO, AKBNK, GARAN, ISCTR, SAHOL (top 5 BIST stocks)
- [ ] **Data Fields:** Price, volume, timestamp, bid/ask (optional)
- [ ] **Rate Limits:** >60 req/min per symbol
- [ ] **Authentication:** Token-based or API key
- [ ] **Documentation:** Complete API docs with examples
- [ ] **Support:** 24/5 support during Istanbul trading hours (10:00-18:00 TRT)

### Nice-to-Have
- [ ] WebSocket support for real-time streaming
- [ ] Historical data API (for backtesting)
- [ ] Order book depth (L2 data)
- [ ] Extended hours trading data
- [ ] SLA-backed compensation for downtime

### Cost Constraints
- **Budget:** $500-$2,000/month
- **Pricing Model:** Prefer per-symbol pricing over per-request
- **Free Tier:** Evaluate free tier for dev/staging environments

### Vendor Shortlist (Example)
1. **Matriks Data (Turkey-based)**
   - Pros: Local, low latency, good BIST coverage
   - Cons: Unknown uptime SLA, limited docs
   
2. **Bloomberg API (Global)**
   - Pros: Excellent uptime, comprehensive data
   - Cons: Expensive ($2,000+/month), overkill for BIST only

3. **IEX Cloud (Global, BIST via partner)**
   - Pros: Good uptime, affordable ($500/month)
   - Cons: Higher latency (US-based), limited BIST support

**Recommendation:** Prioritize Matriks Data for evaluation; fallback to IEX Cloud if SLA not met.

---

## ✅ Pre-Implementation Checklist

### Phase 1: Vendor Evaluation (Week 1)
- [ ] Identify 3 candidate vendors
- [ ] Request API documentation and pricing
- [ ] Set up trial accounts for evaluation
- [ ] Benchmark latency from production environment
- [ ] Verify symbol coverage (THYAO, AKBNK, GARAN, ISCTR, SAHOL)
- [ ] Test rate limits and authentication
- [ ] Review uptime SLA and support terms
- [ ] **Decision Gate:** Select primary vendor and backup vendor

### Phase 2: Integration Development (Week 2-3)
- [ ] Implement vendor client library (`packages/marketdata-bist/src/vendor-client.ts`)
- [ ] Implement schema validation (`packages/marketdata-bist/src/schema.ts`)
- [ ] Implement quality gates (`packages/marketdata-bist/src/quality-gates.ts`)
- [ ] Implement mock fallback logic (`packages/marketdata-bist/src/fallback.ts`)
- [ ] Add Prometheus metrics (latency, quality_gate_pass_rate, fallback_count)
- [ ] Write unit tests (>80% coverage)
- [ ] Write integration tests (vendor API mocked)
- [ ] **Decision Gate:** Code review and security review

### Phase 3: Staging Deployment (Week 4)
- [ ] Deploy to staging environment
- [ ] Configure vendor API keys (secure storage)
- [ ] Enable BIST real feed for staging (flag: `BIST_REAL_FEED=true`)
- [ ] Run smoke tests (100 requests, verify responses)
- [ ] Run load tests (1000 requests over 10 minutes)
- [ ] Monitor quality gate pass rate (target: >99.9%)
- [ ] Monitor latency (target: P95 <500ms)
- [ ] Side-by-side comparison: real vs mock data for 24 hours
- [ ] **Decision Gate:** Staging validation pass/fail

### Phase 4: Canary Deployment (Week 5)
- [ ] **10% Traffic:** Route 10% of BIST requests to real feed
  - Monitor for 48 hours
  - Quality gate pass rate >99.9%
  - No increase in error rate
  - Latency within SLO
- [ ] **50% Traffic:** Route 50% of BIST requests to real feed
  - Monitor for 48 hours
  - Same success criteria
- [ ] **100% Traffic:** Route 100% of BIST requests to real feed
  - Monitor for 72 hours
  - Same success criteria
  - **Decision Gate:** Full rollout or rollback

### Phase 5: Production Monitoring (Ongoing)
- [ ] Set up Grafana dashboard for BIST metrics
- [ ] Configure alerts for quality gate violations
- [ ] Configure alerts for vendor downtime
- [ ] Daily quality report generation
- [ ] Weekly review of quality trends
- [ ] Monthly vendor SLA review

---

## 🔄 Rollback Plan

### Trigger Conditions (Auto-Rollback)
- Quality gate pass rate <95% for 10 consecutive minutes
- Vendor downtime >5 minutes
- P95 latency >1000ms for 10 consecutive minutes
- >10 parsing errors per minute

### Rollback Procedure
1. **Immediate:** Flip `BIST_REAL_FEED=false` via kill-switch API
2. **Verify:** Confirm system falls back to mock data within 30 seconds
3. **Alert:** Notify ops team of rollback incident
4. **Evidence:** Generate incident ZIP with logs, metrics, quality gate violations
5. **Root Cause:** Investigate vendor logs, contact vendor support if needed
6. **Fix:** Address root cause (schema update, quality gate tuning, vendor issue)
7. **Re-deploy:** After fix verified in staging, attempt canary again

**Rollback SLA:** <1 minute from trigger condition to mock fallback active

---

## 📊 Success Metrics

### Quantitative (SLOs)
- **Quality Gate Pass Rate:** >99.9%
- **Vendor Uptime:** >99.5%
- **Latency P95:** <500ms (REST), <100ms (WebSocket)
- **Staleness:** <30s (hard limit), <20s (target)
- **Fallback Frequency:** <1 fallback per week

### Qualitative
- **Operator Confidence:** Positive feedback on BIST data reliability
- **Strategy Performance:** No degradation compared to mock baseline
- **User Feedback:** No complaints about BIST data quality

### Milestone Metrics
- **Week 1:** Vendor selected
- **Week 2-3:** Integration complete, unit tests pass
- **Week 4:** Staging validation pass
- **Week 5:** 100% canary rollout, production monitoring active

---

## 📝 Validation Checklist (per Canary Phase)

### Pre-Flight Checks
- [ ] Vendor API key configured and valid
- [ ] Schema validation tests passing
- [ ] Quality gates configured with correct thresholds
- [ ] Mock fallback tested manually
- [ ] Prometheus metrics exporting correctly
- [ ] Grafana dashboard deployed
- [ ] Alert rules configured

### During Canary (10% / 50% / 100%)
- [ ] Quality gate pass rate monitored every 5 minutes
- [ ] Latency P95 <500ms (REST) or <100ms (WS)
- [ ] Staleness <30s for all ticks
- [ ] No increase in error rate compared to mock baseline
- [ ] Side-by-side comparison: real vs mock distributions match (±5%)
- [ ] Fallback triggered <1 time during phase
- [ ] No user complaints or incident tickets

### Post-Canary (Success Criteria)
- [ ] All validation checks passed for 72 hours
- [ ] Quality gate pass rate >99.9%
- [ ] Zero critical incidents
- [ ] Ops team approves production promotion
- [ ] Evidence ZIP generated and archived

---

## 🛡️ Quality Gates Configuration

### Gate 1: Schema Validation (CRITICAL)
**Threshold:** 100% of messages must pass schema validation  
**Action on Failure:** Reject message, log error, increment counter  
**Fallback Trigger:** >3 consecutive schema failures

```typescript
interface BISTSnapshot {
  symbol: string;          // Required, e.g., "THYAO"
  price: number;           // Required, >0
  volume: number;          // Required, >=0
  timestamp: number;       // Required, Unix ms
  bid?: number;            // Optional
  ask?: number;            // Optional
  change?: number;         // Optional
  changePercent?: number;  // Optional
}
```

### Gate 2: Staleness Check (CRITICAL)
**Threshold:** Timestamp must be within 30 seconds of current time  
**Action on Failure:** Reject message, log warning, increment counter  
**Fallback Trigger:** >5 consecutive staleness failures

```typescript
const now = Date.now();
const stalenessSec = (now - data.timestamp) / 1000;
if (stalenessSec > 30 || stalenessSec < 0) {
  return { passed: false, reason: 'staleness_exceeded' };
}
```

### Gate 3: Price Sanity Check (WARNING)
**Threshold:** Price change <10% from previous tick (unless trading halt/news)  
**Action on Failure:** Log warning, allow message, increment counter  
**Fallback Trigger:** >10 anomalies in 5 minutes

```typescript
const priceChangePct = Math.abs((data.price - prevPrice) / prevPrice);
if (priceChangePct > 0.10) {
  return { passed: true, warning: 'price_anomaly_detected' };
}
```

### Gate 4: Volume Sanity Check (WARNING)
**Threshold:** Volume must be >0 during trading hours (10:00-18:00 TRT)  
**Action on Failure:** Log warning, allow message  
**Fallback Trigger:** N/A (warning only)

```typescript
const isTradingHours = /* 10:00-18:00 TRT check */;
if (isTradingHours && data.volume === 0) {
  return { passed: true, warning: 'zero_volume_during_trading' };
}
```

---

## 📞 Escalation Procedures

### Level 1: Automated (0-5 minutes)
- System detects quality gate failure
- Auto-fallback to mock data
- Alert sent to #spark-ops Slack channel
- Evidence ZIP generated

### Level 2: On-Call Engineer (5-15 minutes)
- On-call engineer acknowledges alert
- Reviews evidence ZIP and logs
- Determines if vendor issue or system issue
- Attempts quick fix (config change, restart)

### Level 3: Vendor Support (15-60 minutes)
- If vendor issue, contact vendor support (24/5 hotline)
- Provide incident details (timestamp, error messages)
- Request ETA for fix

### Level 4: Escalation to Management (>60 minutes)
- If vendor unresponsive or issue critical
- Escalate to CTO/VP Engineering
- Consider permanent switch to backup vendor

---

## 📚 Documentation Deliverables

### For Developers
- [ ] `BIST_VENDOR_INTEGRATION.md` - Integration guide
- [ ] `BIST_QUALITY_GATES.md` - Quality gate configuration
- [ ] `BIST_API_REFERENCE.md` - Vendor API wrapper docs

### For Operators
- [ ] `BIST_RUNBOOK.md` - Incident response procedures
- [ ] `BIST_TROUBLESHOOTING.md` - Common issues and fixes
- [ ] `BIST_MONITORING_GUIDE.md` - Dashboard and alert guide

### For Management
- [ ] `BIST_RISK_ANALYSIS.md` (this document)
- [ ] `BIST_VENDOR_COMPARISON.md` - Vendor evaluation results
- [ ] `BIST_SLA_REPORT.md` - Monthly vendor performance report

---

## 🎯 Conclusion

The BIST real feed transition is a **medium-high risk** initiative requiring careful planning, robust quality gates, and comprehensive fallback mechanisms. The proposed phased rollout (10% → 50% → 100%) minimizes blast radius, while automated fallback ensures system stability even during vendor outages.

**Key Success Factors:**
1. Selecting a reliable vendor with strong SLA
2. Implementing strict quality gates (>99.9% pass rate)
3. Maintaining mock fallback as safety net
4. Continuous monitoring and rapid incident response

**Recommendation:** Proceed with Phase 1 (Vendor Evaluation) immediately. Budget 5 weeks for full rollout, including 1 week buffer for unexpected issues.

---

*Document prepared for v1.3 BIST Real Feed Transition*  
*Next: Vendor selection and trial evaluation*  
*Contact: data-ops@spark-trading.com*

