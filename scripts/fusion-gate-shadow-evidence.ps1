# Fusion Gate Shadow Evidence Collector
# Günlük risk.report'a shadow evidence ekler

param(
    [string]$ReportPath = "evidence/reports/daily_risk_report.json",
    [string]$ExecutorUrl = "http://127.0.0.1:4001"
)

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$evidence = @{
    timestamp = $timestamp
    source = "fusion-gate-shadow"
    status = "active"
    endpoints = @{
        prefixed_status = "$ExecutorUrl/api/public/fusion/risk.gate/status"
        prefixed_apply = "$ExecutorUrl/api/public/fusion/risk.gate/apply"
        root_status = "$ExecutorUrl/risk.gate/status"
        root_apply = "$ExecutorUrl/risk.gate/apply"
    }
    tests = @()
}

# Test prefixed endpoints
try {
    $status = Invoke-WebRequest -Uri "$ExecutorUrl/api/public/fusion/risk.gate/status" -UseBasicParsing
    $evidence.tests += @{
        endpoint = "prefixed_status"
        status_code = $status.StatusCode
        response_time_ms = $status.Headers["X-Response-Time"]
        success = $status.StatusCode -eq 200
    }
} catch {
    $evidence.tests += @{
        endpoint = "prefixed_status"
        error = $_.Exception.Message
        success = $false
    }
}

try {
    $apply = Invoke-WebRequest -Uri "$ExecutorUrl/api/public/fusion/risk.gate/apply" -Method POST -ContentType "application/json" -Body '{"dry":true}' -UseBasicParsing
    $evidence.tests += @{
        endpoint = "prefixed_apply"
        status_code = $apply.StatusCode
        response_time_ms = $apply.Headers["X-Response-Time"]
        success = $apply.StatusCode -eq 200
    }
} catch {
    $evidence.tests += @{
        endpoint = "prefixed_apply"
        error = $_.Exception.Message
        success = $false
    }
}

# Test root endpoints (compat)
try {
    $status = Invoke-WebRequest -Uri "$ExecutorUrl/risk.gate/status" -UseBasicParsing
    $evidence.tests += @{
        endpoint = "root_status"
        status_code = $status.StatusCode
        response_time_ms = $status.Headers["X-Response-Time"]
        success = $status.StatusCode -eq 200
    }
} catch {
    $evidence.tests += @{
        endpoint = "root_status"
        error = $_.Exception.Message
        success = $false
    }
}

try {
    $apply = Invoke-WebRequest -Uri "$ExecutorUrl/risk.gate/apply" -Method POST -ContentType "application/json" -Body '{"dry":true}' -UseBasicParsing
    $evidence.tests += @{
        endpoint = "root_apply"
        status_code = $apply.StatusCode
        response_time_ms = $apply.Headers["X-Response-Time"]
        success = $apply.StatusCode -eq 200
    }
} catch {
    $evidence.tests += @{
        endpoint = "root_apply"
        error = $_.Exception.Message
        success = $false
    }
}

# Calculate success rate
$successCount = ($evidence.tests | Where-Object { $_.success -eq $true }).Count
$totalCount = $evidence.tests.Count
$evidence.success_rate = if ($totalCount -gt 0) { $successCount / $totalCount } else { 0 }

# Write to report
$reportDir = Split-Path $ReportPath -Parent
if (!(Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force
}

$report = @{
    timestamp = $timestamp
    fusion_gate_shadow_evidence = $evidence
}

$report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportPath -Encoding UTF8

Write-Host "Fusion Gate Shadow Evidence collected: $successCount/$totalCount tests passed"
Write-Host "Report written to: $ReportPath"
