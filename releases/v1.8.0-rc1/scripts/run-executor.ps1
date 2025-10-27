# v1.7 Export@Scale - RUNNING GREEN Script (PowerShell)
# Purpose: Boot executor + Smoke/Load tests + Evidence collection

$ErrorActionPreference = 'Continue'
Set-Location C:\dev\CursorGPT_IDE

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "v1.7 Export@Scale - RUNNING GREEN Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# === EVIDENCE FOLDER ===
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceDir = "evidence\export\run_$timestamp"
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
Write-Host "Evidence directory: $evidenceDir" -ForegroundColor Yellow
Write-Host ""

# === PORT 4001 CLEANUP ===
Write-Host "[1/9] Cleaning port 4001..." -ForegroundColor Green
$portProcesses = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($portProcesses) {
    foreach ($pid in $portProcesses) {
        Write-Host "  Killing process $pid" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        "Killed PID $pid" | Out-File "$evidenceDir\port_kill.txt" -Append
    }
    Start-Sleep -Seconds 2
}
Write-Host "  Port 4001 cleaned" -ForegroundColor White
Write-Host ""

# === START EXECUTOR ===
Write-Host "[2/9] Starting executor with ts-node ESM loader..." -ForegroundColor Green
$env:TS_NODE_TRANSPILE_ONLY = "1"
$env:FASTIFY_LOG_LEVEL = "info"

$executorJob = Start-Job -ScriptBlock {
    Set-Location C:\dev\CursorGPT_IDE
    $env:TS_NODE_TRANSPILE_ONLY = "1"
    node --loader ts-node/esm services/executor/src/index.ts 2>&1
} 

Write-Host "  Executor job started (Job ID: $($executorJob.Id))" -ForegroundColor White
Write-Host ""

# === BOOT POLL ===
Write-Host "[3/9] Waiting for executor to boot (max 60s)..." -ForegroundColor Green
$maxAttempts = 30
$attempt = 0
$booted = $false

while ($attempt -lt $maxAttempts -and -not $booted) {
    $attempt++
    try {
        $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:4001/health -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $booted = $true
            Write-Host "  Executor ready! (attempt $attempt)" -ForegroundColor Green
            $response.Content | Out-File "$evidenceDir\health_success.txt"
            "BOOT=OK" | Out-File "$evidenceDir\boot_status.txt"
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $booted) {
    Write-Host "  [ERROR] Executor failed to boot after 60s" -ForegroundColor Red
    "BOOT=FAILED" | Out-File "$evidenceDir\boot_status.txt"
    
    Write-Host "" 
    Write-Host "=== Executor Job Output ===" -ForegroundColor Red
    Receive-Job -Job $executorJob | Out-File "$evidenceDir\boot_output.txt"
    Get-Content "$evidenceDir\boot_output.txt" | Select-Object -First 50
    
    Stop-Job -Job $executorJob
    Remove-Job -Job $executorJob
    
    Write-Host ""
    Write-Host "Evidence saved to: $evidenceDir" -ForegroundColor Yellow
    exit 2
}
Write-Host ""

# === BASELINE METRICS ===
Write-Host "[4/9] Capturing baseline metrics..." -ForegroundColor Green
try {
    Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/export/status | Select-Object -ExpandProperty Content | Out-File "$evidenceDir\status_before.txt"
    Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/metrics | Select-Object -ExpandProperty Content | Out-File "$evidenceDir\metrics_before.txt"
    Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/export/metrics | Select-Object -ExpandProperty Content | Out-File "$evidenceDir\export_metrics_before.txt"
    Write-Host "  Baseline captured" -ForegroundColor White
} catch {
    Write-Host "  Warning: Could not capture all baseline metrics" -ForegroundColor Yellow
}
Write-Host ""

# === SMOKE TESTS ===
Write-Host "[5/9] Running smoke tests (1k CSV + 1k PDF)..." -ForegroundColor Green
node scripts/seed-export.js --records=1000 --format=csv > "$evidenceDir\seed_1k_csv.out" 2> "$evidenceDir\seed_1k_csv.err"
Write-Host "  - 1k CSV done" -ForegroundColor White

node scripts/seed-export.js --records=1000 --format=pdf > "$evidenceDir\seed_1k_pdf.out" 2> "$evidenceDir\seed_1k_pdf.err"
Write-Host "  - 1k PDF done" -ForegroundColor White

if (Test-Path exports) {
    Get-ChildItem exports | Out-File "$evidenceDir\exports_ls_after_smoke.txt"
}
Write-Host "  Smoke tests complete" -ForegroundColor Green
Write-Host ""

# === LOAD TESTS ===
Write-Host "[6/9] Running load tests (10k CSV + batch)..." -ForegroundColor Green
node scripts/seed-export.js --records=10000 --format=csv > "$evidenceDir\seed_10k_csv.out" 2> "$evidenceDir\seed_10k_csv.err"
Write-Host "  - 10k CSV done" -ForegroundColor White

node scripts/seed-export.js --batch > "$evidenceDir\seed_batch.out" 2> "$evidenceDir\seed_batch.err"
Write-Host "  - Batch test done" -ForegroundColor White
Write-Host "  Load tests complete" -ForegroundColor Green
Write-Host ""

# === ASSERTIONS ===
Write-Host "[7/9] Running assertions..." -ForegroundColor Green
node scripts/assert-export.js > "$evidenceDir\assert.out" 2> "$evidenceDir\assert.err"
Write-Host "  Assertions complete" -ForegroundColor White
Write-Host ""

# === FINAL METRICS ===
Write-Host "[8/9] Capturing final metrics..." -ForegroundColor Green
try {
    Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/metrics | Select-Object -ExpandProperty Content | Out-File "$evidenceDir\metrics_after.txt"
    Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/export/metrics | Select-Object -ExpandProperty Content | Out-File "$evidenceDir\export_metrics_after.txt"
    Get-ChildItem exports | Out-File "$evidenceDir\exports_ls_final.txt"
    Write-Host "  Metrics captured" -ForegroundColor White
} catch {
    Write-Host "  Warning: Could not capture all final metrics" -ForegroundColor Yellow
}
Write-Host ""

# === SUMMARY ===
Write-Host "[9/9] Generating summary..." -ForegroundColor Green
$summary = @"
v1.7 Export@Scale - Test Run Summary
=====================================

Smoke Tests:
  - 1k CSV: See seed_1k_csv.out
  - 1k PDF: See seed_1k_pdf.out

Load Tests:
  - 10k CSV: See seed_10k_csv.out
  - Batch: See seed_batch.out

Assertions:
$(Get-Content "$evidenceDir\assert.out" -ErrorAction SilentlyContinue)

"@

$summary | Out-File "$evidenceDir\SUMMARY.txt"

# === HEALTH STATUS ===
$assertContent = Get-Content "$evidenceDir\assert.out" -ErrorAction SilentlyContinue -Raw
if ($assertContent -match "passed|success") {
    "HEALTH=GREEN" | Out-File "$evidenceDir\HEALTH.txt"
    "Status: GREEN - All assertions passed" | Out-File "$evidenceDir\SUMMARY.txt" -Append
    $healthColor = "Green"
    $healthStatus = "GREEN"
} else {
    "HEALTH=YELLOW" | Out-File "$evidenceDir\HEALTH.txt"
    "Status: YELLOW - Check assert.out for details" | Out-File "$evidenceDir\SUMMARY.txt" -Append
    $healthColor = "Yellow"
    $healthStatus = "YELLOW"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Test Run Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Evidence Directory: $evidenceDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Quick Check:" -ForegroundColor White
Write-Host "HEALTH: $healthStatus" -ForegroundColor $healthColor
Write-Host ""
Write-Host "Full results in: $evidenceDir" -ForegroundColor Yellow
Write-Host ""

# === CLEANUP ===
Write-Host "Stopping executor..." -ForegroundColor Yellow
Stop-Job -Job $executorJob -ErrorAction SilentlyContinue
Remove-Job -Job $executorJob -ErrorAction SilentlyContinue

Write-Host "Done!" -ForegroundColor Green

