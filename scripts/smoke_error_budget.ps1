param([string]$Base="http://127.0.0.1:3003")

Write-Output "SMOKE ERROR BUDGET: Testing $Base/api/public/error-budget"

try {
    $r = Invoke-RestMethod -Uri "$Base/api/public/error-budget" -TimeoutSec 10 -ErrorAction Stop
    
    if ($r.remaining_pct -ne $null) {
        $pct = $r.remaining_pct
        $color = if ($pct -ge 60) { "GREEN" } elseif ($pct -ge 30) { "YELLOW" } else { "RED" }
        Write-Output "SMOKE EB: PASS (remaining=$pct%, color=$color, mock=$($r._mock))"
        exit 0
    } else {
        Write-Output "SMOKE EB: ATTENTION (remaining_pct missing)"
        exit 1
    }
} catch {
    Write-Output "SMOKE EB: ATTENTION - $($_.Exception.Message)"
    exit 1
}

