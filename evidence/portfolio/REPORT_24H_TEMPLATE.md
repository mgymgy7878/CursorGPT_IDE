# Spark • Portfolio Real Data — 24h Evidence Report

**Tarih Aralığı:** {{START_ISO}} – {{END_ISO}} (TZ=Europe/Istanbul)  
**Sürüm:** v1.9-p3 • **Environment:** {{ENV}} • **Service:** executor  
**Report Generated:** {{REPORT_TS}}

---

## TL;DR (3 Madde)

1) **p95 refresh latency:** **{{P95_MS}} ms** (hedef < 1500 ms) → {{P95_STATUS}}
2) **Data staleness:** **{{STALE_S}} s** (hedef < 60 s) → {{STALE_STATUS}}
3) **Hata oranı:** **{{ERR_RATE}}/s** (hedef < 0.01/s) → {{ERR_STATUS}}

---

## Executive Summary

**Overall Status:** {{OVERALL_STATUS}} (🟢 GREEN / 🟡 YELLOW / 🔴 RED)

**Key Metrics:**
- Portfolio refresh latency (p95): {{P95_MS}} ms
- Portfolio refresh latency (p50): {{P50_MS}} ms
- API error rate (5m avg): {{ERR_RATE}}/s
- Data staleness (p95): {{STALENESS_P95_S}} s
- Data staleness (avg): {{STALE_AVG_S}} s
- Total portfolio value (avg): ${{TV_AVG_USD}}
- Asset count (avg): {{ASSET_COUNT}}
- Uptime: {{UPTIME_PCT}}%

**SLO Compliance:**
- Latency SLO (p95 < 1500ms): {{LATENCY_SLO_STATUS}}
- Staleness SLO (< 60s): {{STALENESS_SLO_STATUS}}
- Error Rate SLO (< 0.01/s): {{ERROR_SLO_STATUS}}
- Uptime SLO (> 99%): {{UPTIME_SLO_STATUS}}

---

## Kanıt Dosyaları

**Evidence Location:** `evidence/portfolio/{{TS}}/`

### API Snapshots
- `api_response_start.json` - Initial API response (T+0)
- `api_response_12h.json` - Mid-point API response (T+12h)
- `api_response_end.json` - Final API response (T+24h)

### Metrics Snapshots
- `metrics_portfolio_start.txt` - Initial metrics (T+0)
- `metrics_portfolio_12h.txt` - Mid-point metrics (T+12h)
- `metrics_portfolio_end.txt` - Final metrics (T+24h)
- `metrics_full_24h.txt` - Complete 24h metrics dump

### Prometheus Data
- `prom_targets.png` - Prometheus targets screenshot
- `prom_rules.png` - Alert rules screenshot
- `prom_query_results.json` - PromQL query results

### Grafana Panels
- `grafana_panels/latency_p95.png` - Latency panel (24h view)
- `grafana_panels/error_rate.png` - Error rate panel (24h view)
- `grafana_panels/staleness.png` - Staleness gauge (24h view)
- `grafana_panels/total_value.png` - Total value stat (24h view)
- `grafana_panels/asset_count.png` - Asset count bar gauge (24h view)

### Validation Reports
- `canary_validation_start.txt` - Initial canary validation (T+0)
- `canary_validation_12h.txt` - Mid-point validation (T+12h)
- `canary_validation_end.txt` - Final validation (T+24h)

### Logs
- `executor_logs_24h.txt` - Executor logs (filtered: portfolio + error)
- `job_status_24h.txt` - PowerShell job status snapshots

### Archive
- `evidence_24h_{{TS}}.zip` - Complete evidence package

---

## Detailed Metrics

### Latency Analysis

**PromQL Query:**
```promql
job:spark_portfolio_latency_p95:5m{environment="{{ENV}}"}
job:spark_portfolio_latency_p50:5m{environment="{{ENV}}"}
```

**Results:**
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| p95 latency | {{P95_MS}} ms | < 1500 ms | {{P95_STATUS}} |
| p50 latency | {{P50_MS}} ms | < 500 ms | {{P50_STATUS}} |
| Max latency (24h) | {{MAX_MS}} ms | < 3000 ms | {{MAX_STATUS}} |
| Avg latency (24h) | {{AVG_MS}} ms | < 1000 ms | {{AVG_STATUS}} |

**Latency Distribution (24h):**
- < 500ms: {{LT_500_PCT}}%
- 500-1000ms: {{500_1000_PCT}}%
- 1000-1500ms: {{1000_1500_PCT}}%
- > 1500ms: {{GT_1500_PCT}}%

**Slowest Exchange:** {{SLOWEST_EXCHANGE}} ({{SLOWEST_MS}} ms avg)

---

### Error Rate Analysis

**PromQL Query:**
```promql
job:spark_exchange_api_error_rate:5m{environment="{{ENV}}"}
sum(job:spark_portfolio_error_rate_total:5m{environment="{{ENV}}"})
```

**Results:**
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total error rate | {{ERR_RATE}}/s | < 0.01/s | {{ERR_STATUS}} |
| Binance error rate | {{BINANCE_ERR}}/s | < 0.01/s | {{BINANCE_ERR_STATUS}} |
| BTCTurk error rate | {{BTCTURK_ERR}}/s | < 0.01/s | {{BTCTURK_ERR_STATUS}} |

**Error Breakdown (24h):**
| Error Type | Count | Rate (/s) | % of Total |
|------------|-------|-----------|------------|
| auth | {{AUTH_COUNT}} | {{AUTH_RATE}} | {{AUTH_PCT}}% |
| ratelimit | {{RATELIMIT_COUNT}} | {{RATELIMIT_RATE}} | {{RATELIMIT_PCT}}% |
| timeout | {{TIMEOUT_COUNT}} | {{TIMEOUT_RATE}} | {{TIMEOUT_PCT}}% |
| server | {{SERVER_COUNT}} | {{SERVER_RATE}} | {{SERVER_PCT}}% |
| unknown | {{UNKNOWN_COUNT}} | {{UNKNOWN_RATE}} | {{UNKNOWN_PCT}}% |

**Most Common Error:** {{TOP_ERROR_TYPE}} ({{TOP_ERROR_COUNT}} occurrences)

---

### Staleness Analysis

**PromQL Query:**
```promql
job:spark_portfolio_staleness{environment="{{ENV}}"}
```

**Results:**
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Current staleness | {{STALE_CURRENT_S}} s | < 60 s | {{STALE_CURRENT_STATUS}} |
| Avg staleness (24h) | {{STALE_AVG_S}} s | < 60 s | {{STALE_AVG_STATUS}} |
| p95 staleness (24h) | {{STALENESS_P95_S}} s | < 120 s | {{STALENESS_P95_STATUS}} |
| Max staleness (24h) | {{STALE_MAX_S}} s | < 300 s | {{STALE_MAX_STATUS}} |

**Staleness Distribution (24h):**
- < 30s (fresh): {{LT_30_PCT}}%
- 30-60s (acceptable): {{30_60_PCT}}%
- 60-300s (stale): {{60_300_PCT}}%
- > 300s (very stale): {{GT_300_PCT}}%

**Staleness Events:** {{STALE_EVENTS_COUNT}} times exceeded 60s threshold

---

### Portfolio Value Analysis

**PromQL Query:**
```promql
job:spark_portfolio_total_value:current{environment="{{ENV}}"}
spark_portfolio_asset_count{environment="{{ENV}}"}
```

**Results:**
| Exchange | Avg Value (USD) | Asset Count | % of Total |
|----------|-----------------|-------------|------------|
| Binance | {{BINANCE_USD}} | {{BINANCE_ASSETS}} | {{BINANCE_PCT}}% |
| BTCTurk | {{BTCTURK_USD}} | {{BTCTURK_ASSETS}} | {{BTCTURK_PCT}}% |
| **Total** | **{{TOTAL_USD}}** | **{{TOTAL_ASSETS}}** | **100%** |

**Value Trend (24h):**
- Starting value: ${{START_USD}}
- Ending value: ${{END_USD}}
- Change: {{VALUE_CHANGE_PCT}}% ({{VALUE_CHANGE_USD_SIGN}})
- Volatility (std dev): {{VALUE_VOLATILITY_PCT}}%

**Anomalies:** {{VALUE_ANOMALIES_COUNT}} price drops > 10% detected

---

## Olaylar & Anomaliler

### Alert Fires (24h)

{{#if ALERTS}}
| Timestamp | Alert Name | Severity | Exchange | Duration | Resolution |
|-----------|------------|----------|----------|----------|------------|
{{#each ALERTS}}
| {{TS}} | {{NAME}} | {{SEVERITY}} | {{EXCHANGE}} | {{DURATION}} | {{RESOLUTION}} |
{{/each}}
{{else}}
✅ No alerts fired during 24h period
{{/if}}

### Notable Events

{{#if EVENTS}}
{{#each EVENTS}}
#### {{TS}} — {{DESCRIPTION}}
- **Severity:** {{SEVERITY}} (info/warning/critical)
- **Component:** {{COMPONENT}} (portfolio/metrics/connector)
- **Impact:** {{IMPACT}}
- **Action Taken:** {{ACTION}}
- **Resolution Time:** {{RESOLUTION_TIME}}
- **Root Cause:** {{ROOT_CAUSE}}
{{/each}}
{{else}}
✅ No notable events during 24h period
{{/if}}

---

## Service Health

### Uptime Analysis

**Total Runtime:** {{RUNTIME_HOURS}} hours  
**Downtime:** {{DOWNTIME_MINUTES}} minutes  
**Uptime Percentage:** {{UPTIME_PCT}}%

**Restart Events:** {{RESTART_COUNT}}
{{#if RESTARTS}}
{{#each RESTARTS}}
- {{TS}}: {{REASON}} (downtime: {{DOWNTIME}})
{{/each}}
{{/if}}

### Resource Usage (Executor)

| Metric | Avg | Peak | Threshold |
|--------|-----|------|-----------|
| CPU % | {{CPU_AVG}} | {{CPU_PEAK}} | < 80% |
| Memory (MB) | {{MEM_AVG}} | {{MEM_PEAK}} | < 512 MB |
| Network (KB/s) | {{NET_AVG}} | {{NET_PEAK}} | N/A |

---

## Sonuç & Öneriler

### Overall Assessment

**Status:** {{OVERALL_STATUS}}

{{#if GREEN}}
✅ **GREEN** - All SLOs met, system performing optimally
- Latency within targets
- Error rate negligible
- Data freshness excellent
- No critical events

Continue monitoring, implement micro-improvements as planned.
{{/if}}

{{#if YELLOW}}
⚠️ **YELLOW** - Some SLOs missed, attention required
- {{YELLOW_REASONS}}

Review recommendations below and address within next sprint.
{{/if}}

{{#if RED}}
🔴 **RED** - Critical issues detected, immediate action required
- {{RED_REASONS}}

Implement fixes immediately before next deployment.
{{/if}}

---

### Öneriler

#### P0 - Critical (Immediate)
{{#if P0_ITEMS}}
{{#each P0_ITEMS}}
- **{{TITLE}}**
  - Issue: {{ISSUE}}
  - Impact: {{IMPACT}}
  - Fix: {{FIX}}
  - ETA: {{ETA}}
{{/each}}
{{else}}
✅ No P0 items
{{/if}}

#### P1 - High (This Sprint)
{{#if P1_ITEMS}}
{{#each P1_ITEMS}}
- **{{TITLE}}**
  - Issue: {{ISSUE}}
  - Impact: {{IMPACT}}
  - Fix: {{FIX}}
  - ETA: {{ETA}}
{{/each}}
{{else}}
✅ No P1 items
{{/if}}

#### P2 - Medium (Next Sprint)
{{#if P2_ITEMS}}
{{#each P2_ITEMS}}
- **{{TITLE}}**
  - Issue: {{ISSUE}}
  - Impact: {{IMPACT}}
  - Fix: {{FIX}}
  - ETA: {{ETA}}
{{/each}}
{{else}}
✅ No P2 items
{{/if}}

---

## Next Sprint Planning

### Sprint N+2 Suggestions

Based on 24h evidence, recommend prioritizing:

1. **{{NEXT_1}}** (Effort: {{NEXT_1_EFFORT}}, Impact: {{NEXT_1_IMPACT}})
2. **{{NEXT_2}}** (Effort: {{NEXT_2_EFFORT}}, Impact: {{NEXT_2_IMPACT}})
3. **{{NEXT_3}}** (Effort: {{NEXT_3_EFFORT}}, Impact: {{NEXT_3_IMPACT}})

---

## Appendix

### PromQL Queries Used

```promql
# Latency p95
job:spark_portfolio_latency_p95:5m{environment="{{ENV}}"}

# Latency p50
job:spark_portfolio_latency_p50:5m{environment="{{ENV}}"}

# Error rate by type
job:spark_exchange_api_error_rate:5m{environment="{{ENV}}"}

# Total error rate
sum(job:spark_portfolio_error_rate_total:5m{environment="{{ENV}}"})

# Staleness
job:spark_portfolio_staleness{environment="{{ENV}}"}

# Total value
sum by (exchange) (job:spark_portfolio_total_value:current{environment="{{ENV}}"})

# Asset count
sum by (exchange) (job:spark_portfolio_asset_count:current{environment="{{ENV}}"})
```

### Evidence Collection Commands

```powershell
# Collect 24h evidence
.\scripts\portfolio-sprint-evidence.ps1

# Generate 24h report
.\scripts\generate-24h-report.ps1 -StartTime "{{START_ISO}}" -EndTime "{{END_ISO}}"

# Query Prometheus for metrics
curl "http://localhost:9090/api/v1/query?query=job:spark_portfolio_latency_p95:5m"

# Export Grafana panels
.\scripts\export-grafana-panels.ps1 -DashboardUid "spark-portfolio"
```

---

**Report Generated By:** portfolio-sprint-evidence.ps1 v2.0  
**Collaboration:** cursor (Claude 3.5 Sonnet) + chatgpt  
**Sprint:** v1.9-p3 Portfolio Real Data Integration  
**Status:** {{OVERALL_STATUS}} 🚀

