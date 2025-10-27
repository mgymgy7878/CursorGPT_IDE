# scripts/smoke-health.ps1
$ErrorActionPreference = "SilentlyContinue"
function Check($name, $url) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 -Uri $url
    if ($r.StatusCode -eq 200) { Write-Host "$name OK" -ForegroundColor Green; return $true }
    else { Write-Host "$name FAIL ($($r.StatusCode))" -ForegroundColor Red; return $false }
  } catch { Write-Host "$name FAIL ($($_.Exception.Message))" -ForegroundColor Red; return $false }
}
$w = Check "WEB /api/public/health" "http://127.0.0.1:3003/api/public/health"
$e = Check "EXEC /health" "http://127.0.0.1:4001/health"
if ($w -and $e) { exit 0 } else { exit 1 }