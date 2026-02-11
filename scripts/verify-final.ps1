# Final Verification Script - Kanıt Paketi Toplayıcı
# Tüm endpoint'leri test eder ve kanıtları toplar

# PowerShell Version Guard - Checksum disiplini için PS7+ gerekli
if ($PSVersionTable.PSVersion.Major -lt 7) {
  Write-Host "ERROR: PowerShell 7+ required for checksum consistency." -ForegroundColor Red
  Write-Host "Current version: $($PSVersionTable.PSVersion)" -ForegroundColor Yellow
  Write-Host "Please use 'pwsh' instead of 'powershell' or install PowerShell 7+." -ForegroundColor Yellow
  exit 1
}

param(
  [string]$OutDir = "evidence/final_verification_$(Get-Date -Format 'yyyy_MM_dd_HH_mm_ss')",
  [switch]$SkipExecutorCheck
)

$ErrorActionPreference = "Continue"

Write-Host "🔍 Final Verification - Evidence Collector" -ForegroundColor Cyan
Write-Host "Output directory: $OutDir" -ForegroundColor Gray

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Save-Cmd {
  param([string]$Name, [scriptblock]$Cmd)
  $path = Join-Path $OutDir $Name
  Write-Host "  Collecting: $Name..." -ForegroundColor Yellow
  try {
    $out = & $Cmd 2>&1
    $out | Set-Content -Encoding utf8 -Path $path
    Write-Host "    ✅ Saved to $Name" -ForegroundColor Green
  } catch {
    $errorMsg = $_.Exception.Message
      $errorMsg | Set-Content -Encoding utf8 -Path $path
    Write-Host "    ⚠️  Error: $errorMsg" -ForegroundColor Yellow
  }
}

# --- Pre-flight: Executor health check
Write-Host "`n📡 Pre-flight: Executor Health Check" -ForegroundColor Cyan
if (-not $SkipExecutorCheck) {
  $portCheck = netstat -ano | Select-String ":4001.*LISTENING"
  if (-not $portCheck) {
    Write-Host "  ⚠️  Port 4001 is not listening!" -ForegroundColor Yellow
    Write-Host "  💡 Start Executor: pnpm --filter @spark/executor dev" -ForegroundColor Gray
    Write-Host "  💡 Or use: .\scripts\dev-stack.ps1" -ForegroundColor Gray
  } else {
    Write-Host "  ✅ Port 4001 is listening" -ForegroundColor Green
  }

  try {
    $healthRes = Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($healthRes.StatusCode -eq 200) {
      $health = $healthRes.Content | ConvertFrom-Json
      Write-Host "  ✅ Executor health: $($health.status) (DB: $($health.db))" -ForegroundColor Green
    } else {
      Write-Host "  ⚠️  Executor health check returned: $($healthRes.StatusCode)" -ForegroundColor Yellow
    }
  } catch {
    Write-Host "  ⚠️  Executor health check failed: $_" -ForegroundColor Yellow
    Write-Host "  💡 Continuing with verification anyway..." -ForegroundColor Gray
  }
}

# --- Infrastructure
Write-Host "`n📦 Infrastructure Checks" -ForegroundColor Cyan
Save-Cmd "docker_compose_ps_postgres.log" { docker compose ps postgres }
Save-Cmd "docker_compose_logs_postgres_tail80.log" { docker compose logs postgres --tail 80 }

# --- Prisma (migration status)
Write-Host "`n🔄 Database Schema" -ForegroundColor Cyan
Save-Cmd "prisma_migrate_status.log" { pnpm exec prisma migrate status }

# --- Executor Health
Write-Host "`n⚡ Executor Endpoints" -ForegroundColor Cyan
Save-Cmd "curl_health.json" { curl.exe -s http://127.0.0.1:4001/health }

# --- Executor API Endpoints
Save-Cmd "curl_audit_verify.json" { curl.exe -s "http://127.0.0.1:4001/v1/audit/verify?limit=200" }
Save-Cmd "curl_strategies.json" { curl.exe -s "http://127.0.0.1:4001/v1/strategies?limit=6" }
Save-Cmd "curl_positions.json" { curl.exe -s "http://127.0.0.1:4001/v1/positions/open?limit=6" }
Save-Cmd "curl_trades.json" { curl.exe -s "http://127.0.0.1:4001/v1/trades/recent?limit=10" }

# --- Web Proxy Endpoints
Write-Host "`n🌐 Web Proxy Endpoints" -ForegroundColor Cyan
Save-Cmd "web_audit_verify.json" { curl.exe -s "http://127.0.0.1:3003/api/audit/verify" }

# Export (JSONL)
Write-Host "`n📥 Audit Export" -ForegroundColor Cyan
$exportPath = Join-Path $OutDir "audit_export.jsonl"
try {
  $exportRes = curl.exe -L -s "http://127.0.0.1:3003/api/audit/export" -o $exportPath 2>&1
  if (Test-Path $exportPath) {
    $fileSize = (Get-Item $exportPath).Length
    Write-Host "  ✅ Export saved: $fileSize bytes" -ForegroundColor Green

    # SHA256 checksum
    try {
      $hash = Get-FileHash -Path $exportPath -Algorithm SHA256
      $hashPath = Join-Path $OutDir "audit_export.jsonl.sha256"
      "$($hash.Hash)  audit_export.jsonl" | Set-Content -Encoding utf8 -Path $hashPath
      Write-Host "  ✅ SHA256 checksum: $($hash.Hash.Substring(0, 16))..." -ForegroundColor Green
    } catch {
      Write-Host "  ⚠️  Could not calculate checksum" -ForegroundColor Yellow
    }

    # İlk 20 satır sample
    try {
      Get-Content $exportPath -TotalCount 20 -ErrorAction Stop | Set-Content -Encoding utf8 -Path (Join-Path $OutDir "audit_export_sample.txt")
      Write-Host "  ✅ Sample (first 20 lines) saved" -ForegroundColor Green
    } catch {
      Write-Host "  ⚠️  Could not create sample file" -ForegroundColor Yellow
    }
  } else {
    Write-Host "  ⚠️  Export file not created" -ForegroundColor Yellow
  }
  $exportRes | Set-Content -Encoding utf8 -Path (Join-Path $OutDir "audit_export_download.log")
} catch {
  $_ | Set-Content -Encoding utf8 -Path (Join-Path $OutDir "audit_export_download.log")
  Write-Host "  ⚠️  Export failed: $_" -ForegroundColor Yellow
}

# --- Summary
Write-Host "`n📊 Verification Summary" -ForegroundColor Cyan
Write-Host "  Evidence collected in: $OutDir" -ForegroundColor Green

# Quick check summary
$healthFile = Join-Path $OutDir "curl_health.json"
if (Test-Path $healthFile) {
  $healthContent = Get-Content $healthFile -Raw
  if ($healthContent -match '"status":"healthy"') {
    Write-Host "  ✅ Executor: Healthy" -ForegroundColor Green
  } else {
    Write-Host "  ⚠️  Executor: Not healthy or not running" -ForegroundColor Yellow
  }
}

$verifyFile = Join-Path $OutDir "curl_audit_verify.json"
if (Test-Path $verifyFile) {
  $verifyContent = Get-Content $verifyFile -Raw
  if ($verifyContent -match '"verified":true') {
    Write-Host "  ✅ Audit Integrity: OK" -ForegroundColor Green
  } else {
    Write-Host "  ⚠️  Audit Integrity: Check failed or broken" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Verification complete!" -ForegroundColor Green
Write-Host ""

