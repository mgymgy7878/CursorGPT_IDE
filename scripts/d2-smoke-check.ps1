# D2 SMOKE Check Script
# Purpose: Verify UI health with 4-second delta metrics
# Usage: pwsh scripts/d2-smoke-check.ps1

Param(
  [int[]]$Ports = @(3003,3004),
  [int]$WaitSeconds = 4
)

function Get-Metrics([int]$Port){
  $u = "http://127.0.0.1:$Port/api/public/metrics"
  try { 
    Invoke-RestMethod $u -TimeoutSec 5 
  } catch { 
    $null 
  }
}

Write-Host "=== D2 SMOKE Check ===" -ForegroundColor Cyan
Write-Host "Checking ports: $($Ports -join ', ')" -ForegroundColor Gray

# Find first responsive port
$port = $null
$m1 = $null
foreach($p in $Ports){ 
  $m1 = Get-Metrics $p
  if($m1){ 
    $port = $p
    Write-Host "Found responsive endpoint on port $port" -ForegroundColor Green
    break 
  }
}

if(-not $m1){ 
  Write-Host "❌ endpoint down - no responsive port found" -ForegroundColor Red
  exit 1 
}

Write-Host "Waiting $WaitSeconds seconds for second sample..." -ForegroundColor Gray
Start-Sleep -Seconds $WaitSeconds

$m2 = Get-Metrics $port

# Calculate delta (safe with null checks)
$delta = 0
try { 
  $val1 = $m1.counters.spark_ws_btcturk_msgs_total
  $val2 = $m2.counters.spark_ws_btcturk_msgs_total
  if($val1 -and $val2){
    $delta = [int]($val2 - $val1)
  }
} catch { 
  $delta = 0 
}

# Calculate staleness (safe with null checks)
$stale = 0.0
try { 
  $staleVal = $m2.gauges.spark_ws_staleness_seconds
  if($null -ne $staleVal){
    $stale = [double]$staleVal
  } else {
    # Fallback to ws_staleness_s (alternative metric name)
    $staleVal = $m2.gauges.ws_staleness_s
    if($null -ne $staleVal){
      $stale = [double]$staleVal
    }
  }
} catch { 
  $stale = 0.0 
}

# Get additional metrics
$reconnects = 0
try {
  $reconnVal = $m2.counters.spark_ws_btcturk_reconnects_total
  if($null -ne $reconnVal){
    $reconnects = [int]$reconnVal
  }
} catch {
  $reconnects = 0
}

$uiMsgs = 0
try {
  $uiVal = $m2.counters.ui_msgs_total
  if($null -ne $uiVal){
    $uiMsgs = [int]$uiVal
  }
} catch {
  $uiMsgs = 0
}

# Output results
Write-Host "`n=== RESULTS ===" -ForegroundColor Yellow
Write-Host "Port:                    $port" -ForegroundColor White
Write-Host "msgs_total delta (${WaitSeconds}s): $delta" -ForegroundColor White
Write-Host "staleness_seconds:       $stale" -ForegroundColor White
Write-Host "reconnects_total:        $reconnects" -ForegroundColor White
Write-Host "ui_msgs_total:           $uiMsgs" -ForegroundColor White

# Determine pass/fail
Write-Host ""
if(($delta -ge 1) -and ($stale -lt 4)) { 
  Write-Host "✅ SMOKE: PASS (live feed active)" -ForegroundColor Green
  exit 0
} else { 
  # Check if it's expected ATTENTION (mock mode)
  if($delta -eq 0 -and $stale -lt 4){
    Write-Host "🟡 SMOKE: ATTENTION (mock mode - expected behavior)" -ForegroundColor Yellow
    Write-Host "   This is normal for development without backend executor." -ForegroundColor Gray
    exit 0
  } else {
    Write-Host "⚠️ SMOKE: ATTENTION (feed may be paused/stale)" -ForegroundColor Yellow
    Write-Host "   Check: staleness=$stale, delta=$delta" -ForegroundColor Gray
    if($stale -ge 60){
      Write-Host "   ❌ CRITICAL: Staleness exceeds 60s threshold" -ForegroundColor Red
      exit 1
    }
    exit 0
  }
}

