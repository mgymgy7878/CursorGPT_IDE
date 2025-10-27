# PORTFOLIO SPRINT EVIDENCE COLLECTION
# Spark Trading Platform - v1.9-p3
# cursor (Claude 3.5 Sonnet) + chatgpt collaboration

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PORTFOLIO SPRINT EVIDENCE COLLECTION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Timestamp için
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceDir = "evidence\portfolio\$ts"
$zipFile = "evidence\portfolio\portfolio_sprint_$ts.zip"

# Evidence dizini oluştur
Write-Host "Evidence dizini oluşturuluyor..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

# 1. Portfolio API Response
Write-Host "1/7 Portfolio API response toplanıyor..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/portfolio" `
        -OutFile "$evidenceDir\portfolio_api_response.json" `
        -TimeoutSec 10
    Write-Host "  ✓ Portfolio API: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Portfolio API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File "$evidenceDir\portfolio_api_response.json"
}

# 2. Metrics Snapshot
Write-Host "2/7 Prometheus metrics toplanıyor..." -ForegroundColor Yellow
try {
    $metrics = Invoke-WebRequest -Uri "http://127.0.0.1:4001/metrics" -UseBasicParsing
    $metrics.Content | Out-File "$evidenceDir\metrics_full.txt" -Encoding utf8
    
    # Portfolio-specific metrics
    $metrics.Content | Select-String -Pattern "spark_portfolio" | Out-File "$evidenceDir\metrics_portfolio.txt" -Encoding utf8
    Write-Host "  ✓ Metrics: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Metrics: FAILED" -ForegroundColor Red
}

# 3. Health Checks
Write-Host "3/7 Health checks yapılıyor..." -ForegroundColor Yellow
$healthEndpoints = @{
    "web-next" = "http://localhost:3003"
    "executor" = "http://localhost:4001/health"
    "prometheus" = "http://localhost:9090/-/healthy"
    "grafana" = "http://localhost:3005/api/health"
}

$healthResults = @()
foreach ($service in $healthEndpoints.Keys) {
    $url = $healthEndpoints[$service]
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        $status = $response.StatusCode
        $healthResults += "$service → $url → Status: $status ✓"
        Write-Host "  ✓ $service : $status" -ForegroundColor Green
    } catch {
        $healthResults += "$service → $url → FAILED: $($_.Exception.Message)"
        Write-Host "  ✗ $service : FAILED" -ForegroundColor Red
    }
}
$healthResults | Out-File "$evidenceDir\health_checks.txt" -Encoding utf8

# 4. Prometheus Targets
Write-Host "4/7 Prometheus targets kontrol ediliyor..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:9090/api/v1/targets" `
        -OutFile "$evidenceDir\prometheus_targets.json" `
        -TimeoutSec 10
    Write-Host "  ✓ Prometheus targets: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Prometheus targets: FAILED" -ForegroundColor Red
}

# 5. Alert Rules
Write-Host "5/7 Alert rules kontrol ediliyor..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:9090/api/v1/rules" `
        -OutFile "$evidenceDir\prometheus_rules.json" `
        -TimeoutSec 10
    Write-Host "  ✓ Alert rules: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Alert rules: FAILED" -ForegroundColor Red
}

# 6. Job Status (PowerShell Jobs)
Write-Host "6/7 PowerShell job status toplanıyor..." -ForegroundColor Yellow
Get-Job | Where-Object { $_.Name -like "*spark*" } | Format-Table -Property Id, Name, State, HasMoreData | Out-String | Out-File "$evidenceDir\powershell_jobs.txt" -Encoding utf8

# 7. Deployment Summary
Write-Host "7/7 Deployment summary oluşturuluyor..." -ForegroundColor Yellow
$summary = @"
PORTFOLIO SPRINT EVIDENCE SUMMARY
===================================
Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Sprint: v1.9-p3 Portfolio Real Data Integration
Evidence ID: $ts

FILES DEPLOYED:
- services/executor/src/services/portfolioService.ts (NEW, 224 lines)
- services/executor/src/connectors/binance.ts (UPDATED, +21 lines)
- services/executor/src/connectors/btcturk.ts (UPDATED, +17 lines)
- services/executor/src/portfolio.ts (UPDATED, +5 lines)
- services/executor/src/types/portfolio.ts (NEW, 24 lines)
- services/executor/src/metrics/portfolio.ts (NEW, ~80 lines)
- monitoring/grafana/provisioning/dashboards/spark-portfolio.json (NEW)
- prometheus/alerts/spark-portfolio.rules.yml (NEW, 84 lines)

SERVICES STATUS:
$(foreach ($result in $healthResults) { "- $result`n" })

API KEY STATUS:
- Binance: $(if ($env:BINANCE_API_KEY) { "Configured (***)" } else { "NOT SET" })
- BTCTurk: $(if ($env:BTCTURK_API_KEY) { "Configured (***)" } else { "NOT SET" })

METRICS VALIDATION:
- Portfolio refresh latency: $(try { (Invoke-WebRequest "http://127.0.0.1:4001/metrics" -UseBasicParsing).Content | Select-String "spark_portfolio_refresh_latency_ms" -Quiet } catch { "N/A" })
- Exchange API errors: $(try { (Invoke-WebRequest "http://127.0.0.1:4001/metrics" -UseBasicParsing).Content | Select-String "spark_exchange_api_error_total" -Quiet } catch { "N/A" })
- Portfolio total value: $(try { (Invoke-WebRequest "http://127.0.0.1:4001/metrics" -UseBasicParsing).Content | Select-String "spark_portfolio_total_value_usd" -Quiet } catch { "N/A" })
- Asset count: $(try { (Invoke-WebRequest "http://127.0.0.1:4001/metrics" -UseBasicParsing).Content | Select-String "spark_portfolio_asset_count" -Quiet } catch { "N/A" })
- Last update timestamp: $(try { (Invoke-WebRequest "http://127.0.0.1:4001/metrics" -UseBasicParsing).Content | Select-String "spark_portfolio_last_update_timestamp" -Quiet } catch { "N/A" })

ACCEPTANCE CRITERIA:
[ ] /api/portfolio returns 200 OK with real data
[ ] Grafana dashboard shows 5 panels with live data
[ ] Prometheus alert rules loaded (5 rules)
[ ] Error scenarios handled gracefully (no crashes)
[ ] 24h uptime achieved

NEXT STEPS:
1. Verify portfolio data accuracy in UI (http://localhost:3003/portfolio)
2. Monitor Grafana dashboard (http://localhost:3005)
3. Check Prometheus alerts (http://localhost:9090/alerts)
4. Run error scenario tests (wrong API key, timeout, partial failure)
5. Collect 24h uptime evidence

BACKTEST ENGINE (Phase 4b):
- Deferred to next sprint
- DuckDB bundling issue needs resolution (esbuild external config)
- walkforward/portfolio route wiring pending
- Estimated: 2-3 weeks

COLLABORATION:
- cursor (Claude 3.5 Sonnet): Technical implementation, documentation
- chatgpt: Strategic planning, execution roadmap, evidence framework

EVIDENCE FILES:
- portfolio_api_response.json
- metrics_full.txt
- metrics_portfolio.txt
- health_checks.txt
- prometheus_targets.json
- prometheus_rules.json
- powershell_jobs.txt
- deployment_summary.txt (this file)

ROLLBACK PROCEDURE:
1. Stop services: .\durdur.ps1
2. Restore .env files (backup)
3. Git reset: git reset --hard rollback/pre-portfolio-xxxxxxxx
4. Restart: .\basla.ps1
Estimated rollback time: < 2 minutes

SLO TARGETS:
- Portfolio refresh latency P95: < 1500ms
- Data staleness: < 60s
- API error rate: < 0.01/s
- Uptime: > 99.5%

EVIDENCE COLLECTED BY:
Script: scripts/portfolio-sprint-evidence.ps1
Run by: $env:USERNAME
Machine: $env:COMPUTERNAME
OS: Windows $($(Get-WmiObject -Class Win32_OperatingSystem).Version)

---
END OF EVIDENCE SUMMARY
"@

$summary | Out-File "$evidenceDir\deployment_summary.txt" -Encoding utf8

# 8. ZIP oluştur
Write-Host ""
Write-Host "Evidence ZIP oluşturuluyor..." -ForegroundColor Yellow
Compress-Archive -Path $evidenceDir -DestinationPath $zipFile -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  EVIDENCE COLLECTION COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Evidence Directory: $evidenceDir" -ForegroundColor Cyan
Write-Host "Evidence ZIP: $zipFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files Collected:" -ForegroundColor Yellow
Get-ChildItem $evidenceDir | ForEach-Object {
    Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1KB, 2)) KB)" -ForegroundColor White
}
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review evidence files" -ForegroundColor White
Write-Host "  2. Verify acceptance criteria" -ForegroundColor White
Write-Host "  3. Document any issues" -ForegroundColor White
Write-Host "  4. Prepare handoff documentation" -ForegroundColor White
Write-Host ""

