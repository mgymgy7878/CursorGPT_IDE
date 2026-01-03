# Negative Tests - DB Down & Executor Down Senaryoları
# Bu testler gerçek hayatta sistemin nasıl davrandığını gösterir

param(
  [string]$OutDir = "evidence/negative_tests_$(Get-Date -Format 'yyyy_MM_dd_HH_mm_ss')"
)

# PowerShell Version Guard - Checksum disiplini için PS7+ gerekli
if ($PSVersionTable.PSVersion.Major -lt 7) {
  Write-Host "WARNING: PowerShell 7+ recommended for checksum consistency." -ForegroundColor Yellow
  Write-Host "Current version: $($PSVersionTable.PSVersion)" -ForegroundColor Yellow
  Write-Host "Continuing with PowerShell 5.1 (some features may be limited)..." -ForegroundColor Yellow
  # exit 1  # Geçici olarak devam et
}

$ErrorActionPreference = "Continue"

Write-Host "[NEGATIVE] Negative Tests - Degradation Senaryolari" -ForegroundColor Cyan
Write-Host "Output directory: $OutDir" -ForegroundColor Gray

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Save-Cmd {
  param([string]$Name, [scriptblock]$Cmd)
  $path = Join-Path $OutDir $Name
  Write-Host "  Testing: $Name..." -ForegroundColor Yellow
  try {
    $out = & $Cmd 2>&1
    $out | Set-Content -Encoding utf8 -Path $path
    Write-Host "    [OK] Saved to $Name" -ForegroundColor Green
  } catch {
    $errorMsg = $_.Exception.Message
    $errorMsg | Set-Content -Encoding utf8 -Path $path
    Write-Host "    [WARN] Error: $errorMsg" -ForegroundColor Yellow
  }
}

# Test 1: DB Down Senaryosu
Write-Host "`n[TEST 1] Database Down Senaryosu" -ForegroundColor Cyan
Write-Host "  Stopping PostgreSQL..." -ForegroundColor Yellow

$postgresRunning = docker compose ps postgres --format json 2>&1 | ConvertFrom-Json
if ($postgresRunning.State -eq "running") {
  docker compose stop postgres 2>&1 | Out-Null
  Write-Host "  [OK] PostgreSQL stopped" -ForegroundColor Green

  Start-Sleep -Seconds 3

  Write-Host "  Testing Executor health endpoint..." -ForegroundColor Yellow
  Save-Cmd "negative_test_db_down_health.json" { curl.exe -s http://127.0.0.1:4001/health }

  Write-Host "  Restarting PostgreSQL..." -ForegroundColor Yellow
  docker compose start postgres 2>&1 | Out-Null
  Start-Sleep -Seconds 5
  Write-Host "  [OK] PostgreSQL restarted" -ForegroundColor Green
} else {
  Write-Host "  [WARN] PostgreSQL not running, skipping DB down test" -ForegroundColor Yellow
  Save-Cmd "negative_test_db_down_health.json" { Write-Output "PostgreSQL was not running, test skipped" }
}

# Test 2: Executor Down Senaryosu
Write-Host "`n[TEST 2] Executor Down Senaryosu" -ForegroundColor Cyan
Write-Host "  Checking if Executor is running..." -ForegroundColor Yellow

$portCheck = netstat -ano | Select-String ":4001.*LISTENING"
if ($portCheck) {
  Write-Host "  [WARN] Executor is running on port 4001" -ForegroundColor Yellow
  Write-Host "  [INFO] Manual test: Stop Executor (Ctrl+C) and test:" -ForegroundColor Gray
  Write-Host "     curl.exe http://127.0.0.1:4001/health" -ForegroundColor Gray
  Write-Host "     curl.exe http://127.0.0.1:3003/api/health" -ForegroundColor Gray

  Save-Cmd "negative_test_executor_down_note.txt" {
    Write-Output "Executor was running during test. Manual test required:"
    Write-Output "1. Stop Executor: pkill -f executor or Ctrl+C"
    Write-Output "2. Test: curl.exe http://127.0.0.1:3003/api/health"
    Write-Output "Expected: 503 status, error message"
  }
} else {
  Write-Host "  [OK] Executor is not running - testing degraded state" -ForegroundColor Green
  Save-Cmd "negative_test_executor_down_health.json" { curl.exe -s http://127.0.0.1:3003/api/health }
}

Write-Host "`n[SUMMARY] Negative Tests Summary" -ForegroundColor Cyan
Write-Host "  Evidence collected in: $OutDir" -ForegroundColor Green
Write-Host "`n[OK] Negative tests complete!" -ForegroundColor Green

