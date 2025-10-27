# PORTFOLIO SPRINT EXECUTION PLAN

**Sprint**: v1.9-p3 Portfolio Real Data Integration  
**Timeline**: 24-48 hours  
**Status**: READY TO EXECUTE  
**Decision**: Portfolio First, Backtest Later (chatgpt + cursor collaboration)

---

## 🎯 SPRINT GOAL

**Primary**: Activate real portfolio data from Binance and BTCTurk in production UI  
**Secondary**: Establish monitoring stack (Prometheus + Grafana)  
**Tertiary**: Collect evidence for production readiness

---

## ⏱️ TIMELINE & MILESTONES

| Time | Phase | Tasks | Success Criteria |
|------|-------|-------|------------------|
| **Hour 0-2** | Setup | API keys, .env files | Keys validated |
| **Hour 2-3** | Launch | Start services | Health checks pass |
| **Hour 3-4** | Smoke | Basic functionality | Real data in UI |
| **Hour 4-6** | Monitor | Grafana/Prometheus | 5 panels live |
| **Hour 6-8** | Resilience | Error scenarios | No crashes |
| **Hour 8-24** | Stabilize | Uptime test | 24h no issues |
| **Hour 24-48** | Evidence | Documentation | Sprint complete |

---

## 📋 EXECUTION CHECKLIST

### Phase 1: Environment Setup (Hour 0-2)

#### 1.1 API Key Creation

**Binance**:
```powershell
# 1. Navigate to: https://www.binance.com/en/my/settings/api-management
# 2. Click "Create API"
# 3. Enable ONLY "Enable Reading" permission
# 4. Save API Key and Secret Key
# 5. IMPORTANT: Do NOT enable trading permissions
```

**BTCTurk**:
```powershell
# 1. Navigate to: https://pro.btcturk.com/hesabim/api
# 2. Create new API Key
# 3. Enable ONLY "Bakiye Görüntüleme" (View Balance)
# 4. Save API Key and Base64 Secret
# 5. IMPORTANT: Do NOT enable trading permissions
```

**Admin Token**:
```powershell
# Generate secure token
openssl rand -hex 32
# Or on Windows without openssl:
-join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

#### 1.2 Environment Files

**Executor**:
```powershell
# Copy template
cd C:\dev\CursorGPT_IDE\services\executor
Copy-Item .env.template .env

# Edit .env file:
# - Add Binance API_KEY and API_SECRET
# - Add BTCTurk API_KEY and API_SECRET_BASE64
# - Add ADMIN_TOKEN
```

**Web-Next**:
```powershell
# Copy template
cd C:\dev\CursorGPT_IDE\apps\web-next
Copy-Item .env.local.template .env.local

# Verify EXECUTOR_BASE_URL=http://127.0.0.1:4001
```

#### 1.3 API Key Validation

**Test Binance**:
```powershell
# Manual curl test
curl -X GET "https://api.binance.com/api/v3/account?timestamp=$(([DateTimeOffset]::Now.ToUnixTimeMilliseconds()))" `
  -H "X-MBX-APIKEY: YOUR_BINANCE_KEY"
# Expected: Account info JSON (without signature, will get error, but confirms key is valid)
```

**Test BTCTurk**:
```powershell
# Test will be done via connector after executor starts
```

**Acceptance**:
- [ ] Binance API key created (read-only)
- [ ] BTCTurk API key created (read-only)
- [ ] Admin token generated
- [ ] .env files created and populated
- [ ] No keys committed to git (.gitignore verified)

---

### Phase 2: Service Launch (Hour 2-3)

#### 2.1 Start Services

```powershell
# Navigate to project root
cd C:\dev\CursorGPT_IDE

# Start all services (background jobs)
.\basla.ps1

# Wait 10 seconds for startup
Start-Sleep -Seconds 10

# Check job status
Get-Job | Where-Object { $_.Name -like "*spark*" }
```

#### 2.2 Health Checks

```powershell
# Web-Next health
curl http://localhost:3003
# Expected: 200 OK (HTML response)

# Executor health
curl http://localhost:4001/health
# Expected: {"ok":true}

# Portfolio API
curl http://localhost:4001/api/portfolio
# Expected: JSON with accounts array
```

#### 2.3 View Logs

```powershell
# Web-Next logs
Receive-Job -Name spark-web-next -Keep | Select-Object -Last 20

# Executor logs
Receive-Job -Name spark-executor -Keep | Select-Object -Last 20

# Look for:
# - No error messages
# - "Portfolio API" or similar success messages
# - Port binding successful (3003, 4001)
```

**Acceptance**:
- [ ] basla.ps1 executed successfully
- [ ] Web-Next job running (State: Running)
- [ ] Executor job running (State: Running)
- [ ] Health endpoints return 200 OK
- [ ] No critical errors in logs

---

### Phase 3: Smoke Tests (Hour 3-4)

#### 3.1 Portfolio API Response

```powershell
# Fetch portfolio data
$response = Invoke-WebRequest -Uri "http://localhost:4001/api/portfolio" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

# Validate structure
Write-Host "Accounts count: $($data.accounts.Length)"
Write-Host "Updated at: $($data.updatedAt)"

# Display accounts
foreach ($acc in $data.accounts) {
    Write-Host "$($acc.exchange): $($acc.totals.totalUsd) USD ($($acc.balances.Length) assets)"
}
```

**Expected Output**:
```
Accounts count: 2
Updated at: 2025-10-10T15:30:00.000Z
binance: 41250 USD (3 assets)
btcturk: 6800 USD (2 assets)
```

#### 3.2 UI Verification

```powershell
# Open portfolio page
start http://localhost:3003/portfolio

# Manual checks:
# 1. Page loads without errors
# 2. Exchange tabs visible (Binance, BTCTurk)
# 3. Asset table shows real balances
# 4. Allocation donut chart renders
# 5. Total USD value matches API response
# 6. "Yenile" button works (refreshes data)
```

#### 3.3 Metrics Endpoint

```powershell
# Fetch metrics
curl http://localhost:4001/metrics | Select-String "spark_portfolio"

# Look for:
# - spark_portfolio_refresh_latency_ms_bucket
# - spark_exchange_api_error_total
# - spark_portfolio_total_value_usd
# - spark_portfolio_asset_count
# - spark_portfolio_last_update_timestamp
```

**Acceptance**:
- [ ] /api/portfolio returns 200 OK
- [ ] Response has 2 accounts (binance, btcturk)
- [ ] UI displays real balances
- [ ] No "mock" data indicators
- [ ] Metrics endpoint shows portfolio metrics
- [ ] Total USD value > 0

---

### Phase 4: Monitoring Activation (Hour 4-6)

#### 4.1 Start Docker Compose

```powershell
# Navigate to project root
cd C:\dev\CursorGPT_IDE

# Start Prometheus + Grafana
docker compose up -d prometheus grafana

# Wait for containers
Start-Sleep -Seconds 15

# Check container status
docker compose ps

# Expected: prometheus and grafana "Up" status
```

#### 4.2 Prometheus Validation

```powershell
# Prometheus health
curl http://localhost:9090/-/healthy
# Expected: Prometheus is Healthy.

# Check targets
start http://localhost:9090/targets
# Manual check: spark-executor target is UP

# Check metrics
start http://localhost:9090/graph
# Query: spark_portfolio_refresh_latency_ms
# Expected: Time series data visible
```

#### 4.3 Grafana Dashboard

```powershell
# Open Grafana
start http://localhost:3005
# Login: admin / admin (change password if prompted)

# Navigate to Dashboards
# Look for: "Spark" folder → "Spark • Portfolio Performance"

# Verify panels:
# 1. Portfolio Refresh Latency (p50/p95)
# 2. Exchange API Error Rate
# 3. Total Portfolio Value (USD)
# 4. Data Staleness (seconds)
# 5. Asset Count by Exchange
```

#### 4.4 Alert Rules

```powershell
# Check alert rules
start http://localhost:9090/rules

# Expected: 5 alert rules loaded
# - PortfolioRefreshLatencyHighP95
# - ExchangeApiErrorRateHigh
# - PortfolioDataStale
# - PortfolioValueDropAnomaly
# - PortfolioNoAssets
```

**Acceptance**:
- [ ] Prometheus container running
- [ ] Grafana container running
- [ ] spark-executor target UP in Prometheus
- [ ] Grafana dashboard shows 5 panels
- [ ] All panels have live data (not "No data")
- [ ] 5 alert rules loaded

---

### Phase 5: Resilience Testing (Hour 6-8)

#### 5.1 Wrong API Key Scenario

```powershell
# 1. Stop executor
Stop-Job -Name spark-executor
Remove-Job -Name spark-executor

# 2. Edit .env: Set invalid Binance key
cd C:\dev\CursorGPT_IDE\services\executor
# Change BINANCE_API_KEY to "invalid_key"

# 3. Restart executor
cd C:\dev\CursorGPT_IDE
$executorJob = Start-Job -Name "spark-executor" -ScriptBlock {
    Set-Location "C:\dev\CursorGPT_IDE\services\executor"
    $env:NODE_ENV = "development"
    $env:PORT = "4001"
    $env:HOST = "0.0.0.0"
    & pnpm dev
}

# 4. Wait and check
Start-Sleep -Seconds 10
curl http://localhost:4001/api/portfolio

# Expected: 200 OK, but accounts might be empty or only BTCTurk
# Executor should NOT crash
```

**Check Logs**:
```powershell
Receive-Job -Name spark-executor -Keep | Select-String "Binance"
# Expected: "API credentials not configured" or similar warning
```

**Restore**:
```powershell
# Restore correct API key in .env
# Restart executor (repeat step 3)
```

#### 5.2 Network Timeout Simulation

```powershell
# Simulate by stopping internet or using firewall
# Or: Set very low timeout in connector

# Check behavior:
curl http://localhost:4001/api/portfolio
# Expected: 200 OK after timeout, empty accounts or cached data
```

#### 5.3 Partial Failure Test

```powershell
# Invalidate only BTCTurk key, keep Binance valid
# Expected: Binance data visible, BTCTurk skipped
curl http://localhost:4001/api/portfolio
# Verify: accounts array has only 1 element (binance)
```

**Acceptance**:
- [ ] Wrong API key → log warning, no crash
- [ ] Network timeout → graceful degradation
- [ ] Partial failure → working exchange still returns data
- [ ] UI shows appropriate error/empty state
- [ ] Executor remains responsive

---

### Phase 6: Stabilization (Hour 8-24)

#### 6.1 24-Hour Uptime Test

```powershell
# Monitor services for 24 hours
# Check periodically (every 2-4 hours)

# Health check script
$healthCheck = {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $webOk = try { (Invoke-WebRequest "http://localhost:3003" -UseBasicParsing).StatusCode -eq 200 } catch { $false }
    $execOk = try { (Invoke-WebRequest "http://localhost:4001/health" -UseBasicParsing).StatusCode -eq 200 } catch { $false }
    "$timestamp - Web: $webOk, Exec: $execOk" | Out-File -Append "evidence\portfolio\uptime_log.txt"
}

# Run every 2 hours (manually or via scheduled task)
& $healthCheck
```

#### 6.2 Metrics Monitoring

```powershell
# Check Grafana dashboard periodically
# Look for:
# - Consistent latency (p95 < 1500ms)
# - No error spikes
# - Data staleness < 60s
# - No alert fires
```

#### 6.3 Log Review

```powershell
# Review logs for any warnings/errors
Receive-Job -Name spark-executor -Keep | Select-String -Pattern "error|warning" -CaseSensitive:$false

# Document any issues found
```

**Acceptance**:
- [ ] 24-hour uptime achieved (>99%)
- [ ] No critical errors in logs
- [ ] Latency within SLO (p95 < 1500ms)
- [ ] Data staleness < 60s consistently
- [ ] No unexpected alert fires

---

### Phase 7: Evidence Collection (Hour 24-48)

#### 7.1 Run Evidence Script

```powershell
# Execute evidence collection script
cd C:\dev\CursorGPT_IDE
.\scripts\portfolio-sprint-evidence.ps1

# Review output
# Expected: 8 files collected, ZIP created
```

#### 7.2 Manual Evidence

**Screenshots**:
- [ ] Portfolio UI showing real data
- [ ] Grafana dashboard with 5 panels
- [ ] Prometheus targets page (executor UP)
- [ ] Prometheus alerts page (rules loaded)

**Save to**: `evidence\portfolio\{timestamp}\screenshots\`

#### 7.3 Documentation Update

```powershell
# Update PORTFOLIO_ENTEGRASYON_REHBERI.md
# Add section: "Production Deployment Evidence"

# Update TEKNIK_ANALIZ_VE_DETAYLI_RAPOR_2025_10_10.md
# Mark Sprint N+1 as COMPLETED
```

#### 7.4 Git Commit

```powershell
cd C:\dev\CursorGPT_IDE

# Stage changes
git add evidence/portfolio/
git add PORTFOLIO_SPRINT_EXECUTION_PLAN.md
git add services/executor/.env.template
git add apps/web-next/.env.local.template
git add scripts/portfolio-sprint-evidence.ps1

# Commit
git commit -m "[Portfolio] Sprint v1.9-p3 Complete - Production Evidence

- 24h uptime achieved
- Real data from Binance + BTCTurk
- Monitoring stack active (Prometheus + Grafana)
- 5 alert rules operational
- Evidence collected and archived

Sprint: Portfolio Real Data Integration (v1.9-p3)
Timeline: 24-48 hours
Collaboration: cursor (Claude 3.5 Sonnet) + chatgpt
Evidence: evidence/portfolio/{timestamp}.zip

Next Sprint: Binance Futures Portfolio (v1.9-p4)
Deferred: Backtest Engine Phase 4b (DuckDB bundling fix needed)"

# Tag
git tag -a v1.9-p3-portfolio-complete -m "Portfolio real data integration complete with 24h evidence"
```

**Acceptance**:
- [ ] Evidence ZIP created
- [ ] Screenshots captured
- [ ] Documentation updated
- [ ] Git commit created
- [ ] Sprint marked COMPLETE

---

## 🎯 ACCEPTANCE CRITERIA SUMMARY

### Must-Have (P0)
- [x] Code deployed (100% ready)
- [ ] API keys configured
- [ ] Services running (web-next, executor)
- [ ] /api/portfolio returns real data (200 OK)
- [ ] UI displays real balances
- [ ] No crashes on error scenarios

### Should-Have (P1)
- [ ] Monitoring stack active (Prometheus, Grafana)
- [ ] 5 Grafana panels showing live data
- [ ] 5 Prometheus alert rules loaded
- [ ] Metrics endpoint functional
- [ ] 24h uptime achieved

### Nice-to-Have (P2)
- [ ] Evidence ZIP collected
- [ ] Screenshots documented
- [ ] Git commit with tag
- [ ] Handoff documentation complete

---

## 🚨 ROLLBACK PROCEDURE

**Trigger Conditions**:
- Executor crashes repeatedly (>3 times/hour)
- Data corruption detected
- Critical security issue discovered
- Unrecoverable error

**Rollback Steps** (< 2 minutes):

```powershell
# 1. Stop services
cd C:\dev\CursorGPT_IDE
.\durdur.ps1

# 2. Restore .env files
cd services\executor
Copy-Item .env.backup .env -Force

cd ..\..\apps\web-next
Copy-Item .env.local.backup .env.local -Force

# 3. Git rollback (optional)
cd ..\..
git reset --hard rollback/pre-portfolio-xxxxxxxx

# 4. Restart with old config
.\basla.ps1

# 5. Verify rollback
curl http://localhost:4001/health
curl http://localhost:3003
```

**Verification**:
- [ ] Services running
- [ ] Mock data showing (if rolled back)
- [ ] No errors in logs

---

## 📊 SLO TARGETS

| Metric | Target | Alert Threshold | Current |
|--------|--------|-----------------|---------|
| Portfolio Refresh Latency (P95) | < 1000ms | > 1500ms | TBD |
| API Error Rate | < 0.01/s | > 0.05/s | TBD |
| Data Staleness | < 60s | > 300s | TBD |
| Uptime | > 99.5% | < 99% | TBD |

---

## 🔮 NEXT SPRINT PREVIEW

**Sprint N+2: Binance Futures Portfolio** (2 weeks, 34 SP)
- [ ] Futures positions endpoint
- [ ] USDT-M vs COIN-M separation
- [ ] Unrealized P/L tracking
- [ ] Grafana dashboard update

**Sprint N+3: Historical P/L** (2 weeks, 34 SP)
- [ ] Transaction history database
- [ ] P/L time series
- [ ] Tax export (CSV)

**Backtest Engine (Phase 4b)** - DEFERRED
- Issue: DuckDB bundling with esbuild
- Solution: external config + createRequire
- Estimated: 2-3 weeks
- Priority: After Futures Portfolio

---

## 🤝 COLLABORATION NOTES

**cursor (Claude 3.5 Sonnet)**:
- Technical implementation
- Code review and quality
- Documentation (2,800+ lines)
- Evidence framework

**chatgpt**:
- Strategic planning
- Execution roadmap
- Decision making (A vs B vs C)
- Risk assessment

**Shared Principles**:
- User-visible value first
- Low-risk, high-impact
- Evidence-based delivery
- Clean rollback paths

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue**: Portfolio API returns empty accounts
**Solution**: Check API keys in .env, verify read-only permissions

**Issue**: Grafana dashboard not loading
**Solution**: Verify Prometheus target UP, check datasource config

**Issue**: Metrics not showing
**Solution**: Restart executor, verify /metrics endpoint accessible

**Issue**: Executor crashes on startup
**Solution**: Check .env syntax, verify no trailing spaces in keys

### Quick Commands

```powershell
# Status check
Get-Job | Where-Object { $_.Name -like "*spark*" }

# View logs
Receive-Job -Name spark-executor -Keep | Select-Object -Last 50

# Restart executor only
Stop-Job -Name spark-executor; Remove-Job -Name spark-executor
# Then run basla.ps1 executor section

# Test API
curl http://localhost:4001/api/portfolio | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test metrics
curl http://localhost:4001/metrics | Select-String "spark_portfolio" | Select-Object -First 10
```

---

**cursor (Claude 3.5 Sonnet) + chatgpt collaboration**  
**Plan Created**: 10 Ekim 2025  
**Sprint**: v1.9-p3 Portfolio Real Data Integration  
**Status**: READY TO EXECUTE 🚀

