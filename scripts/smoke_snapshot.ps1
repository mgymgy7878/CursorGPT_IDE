param([string]$Base="http://127.0.0.1:3003")

$url = "$Base/api/snapshot/download"
Write-Output "SMOKE SNAPSHOT: Testing $url"

try {
    $body = @{ format = "json"; hours = 1 } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
} catch {
    Write-Output "SMOKE SNAPSHOT: ATTENTION - $($_.Exception.Message)"
    exit 1
}

$ct = $r.Headers['Content-Type']
$status = $r.StatusCode

if ($status -eq 200 -and ($ct -match 'application/json|text/csv')) {
    Write-Output "SMOKE SNAPSHOT: PASS (status=$status, content-type=$ct)"
    exit 0
} else {
    Write-Output "SMOKE SNAPSHOT: ATTENTION (status=$status, content-type=$ct)"
    exit 1
}

