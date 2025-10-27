$ErrorActionPreference = "Stop"

$base = "http://127.0.0.1:4001"

Write-Host "Guardrails Smoke Test Started"

# Test param submission
Write-Host "Testing param submission..."
$submitBody = @{
    strategy = "meanrev"
    oldParams = @{}
    newParams = @{ k = 2 }
} | ConvertTo-Json

$submitResponse = Invoke-RestMethod -Uri "$base/params/submit" -Method POST -Body $submitBody -ContentType "application/json"
Write-Host "Submit response: $($submitResponse | ConvertTo-Json)"

# Test pending params
Write-Host "Testing pending params..."
$pendingResponse = Invoke-RestMethod -Uri "$base/params/pending"
Write-Host "Pending response: $($pendingResponse | ConvertTo-Json)"

# Test approve
Write-Host "Testing approve..."
$approveBody = @{
    strategy = "meanrev"
    actor = "smoke-test"
    reason = "smoke test approval"
} | ConvertTo-Json

$approveResponse = Invoke-RestMethod -Uri "$base/params/approve" -Method POST -Body $approveBody -ContentType "application/json"
Write-Host "Approve response: $($approveResponse | ConvertTo-Json)"

# Test history
Write-Host "Testing history..."
$historyResponse = Invoke-RestMethod -Uri "$base/params/history"
Write-Host "History response: $($historyResponse | ConvertTo-Json)"

# Test canary strategies
Write-Host "Testing canary strategies..."
$canaryResponse = Invoke-RestMethod -Uri "$base/canary/strategies?dry=true"
Write-Host "Canary response: $($canaryResponse | ConvertTo-Json)"

# Test metrics
Write-Host "Testing metrics..."
$metrics = Invoke-RestMethod -Uri "$base/metrics"
if ($metrics -notmatch "guardrails_param_apply_total" -or $metrics -notmatch "guardrails_pending_age_seconds") {
    throw "guardrails new metrics missing"
}

Write-Host "guardrails-smoke PASS"
