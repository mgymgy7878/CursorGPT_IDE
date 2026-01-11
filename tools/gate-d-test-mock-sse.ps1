# Gate D: Test Mock SSE Stream (Non-Interactive)
# Purpose: Verify mock stream is active and working without browser interaction
# Updated: Uses request flag (?mock=1) instead of relying on env vars
param(
  [string]$ApiUrl = "http://127.0.0.1:3003/api/copilot/chat",
  [int]$ExpectedTokens = 25,
  [switch]$UseHeader  # If set, use x-spark-mock header instead of query param
)

$ErrorActionPreference = "Stop"

Write-Host "=== Gate D: Mock SSE Stream Test ===" -ForegroundColor Cyan

# Add mock flag to URL or headers
$finalUrl = $ApiUrl
$headers = @{
  "Content-Type" = "application/json"
  "Accept" = "text/event-stream"
}

if ($UseHeader) {
  $headers["x-spark-mock"] = "1"
  Write-Host "API URL: $finalUrl" -ForegroundColor Gray
  Write-Host "Mock flag: x-spark-mock: 1 (header)" -ForegroundColor Cyan
} else {
  $finalUrl = "$ApiUrl`?mock=1"
  Write-Host "API URL: $finalUrl" -ForegroundColor Gray
  Write-Host "Mock flag: ?mock=1 (query param)" -ForegroundColor Cyan
}

Write-Host "Expected tokens: $ExpectedTokens" -ForegroundColor Gray
Write-Host ""

# Test SSE stream with curl
Write-Host "Triggering mock SSE stream..." -ForegroundColor Yellow

$tokenCount = 0
$hasOpen = $false
$hasClose = $false
$errors = @()

try {
  # Use curl to trigger SSE stream
  $body = @{
    message = "test"
  } | ConvertTo-Json

  $response = Invoke-WebRequest -Uri $finalUrl `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -UseBasicParsing `
    -TimeoutSec 10 `
    -ErrorAction Stop

  # Parse SSE events
  $lines = $response.Content -split "`n"

  foreach ($line in $lines) {
    if ($line -match "^data:\s*(.+)$") {
      $eventData = $matches[1]
      try {
        $event = $eventData | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($event) {
          if ($event.event -eq "token") {
            $tokenCount++
          } elseif ($event.event -eq "complete") {
            $hasClose = $true
          } elseif ($event.event -eq "error") {
            $errors += $eventData
          }
        }
      } catch {
        # Skip non-JSON lines
      }
    }
  }

  Write-Host "Stream completed" -ForegroundColor Green
  Write-Host ""

} catch {
  Write-Host "Error: $_" -ForegroundColor Red
  exit 1
}

# Verify results
Write-Host "=== Results ===" -ForegroundColor Cyan
Write-Host "Tokens received: $tokenCount (expected: $ExpectedTokens)" -ForegroundColor $(if ($tokenCount -eq $ExpectedTokens) { "Green" } else { "Yellow" })
Write-Host "Stream closed: $(if ($hasClose) { "Yes" } else { "No" })" -ForegroundColor $(if ($hasClose) { "Green" } else { "Yellow" })
if ($errors.Count -gt 0) {
  Write-Host "Errors: $($errors.Count)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Cyan

$success = $true

if ($tokenCount -eq 0) {
  Write-Host "❌ FAIL: No tokens received" -ForegroundColor Red
  Write-Host "   Possible reasons:" -ForegroundColor Yellow
  Write-Host "   - Dev server not running (NODE_ENV must be 'development')" -ForegroundColor Yellow
  Write-Host "   - Wrong URL or port" -ForegroundColor Yellow
  Write-Host "   - Server logs should show '[MOCK SSE]' message" -ForegroundColor Yellow
  Write-Host "   - Try: .\tools\gate-d-test-mock-sse.ps1 -UseHeader" -ForegroundColor Yellow
  $success = $false
} elseif ($tokenCount -lt $ExpectedTokens) {
  Write-Host "⚠️  WARNING: Received $tokenCount tokens, expected $ExpectedTokens" -ForegroundColor Yellow
} else {
  Write-Host "✅ PASS: Received $tokenCount tokens (expected $ExpectedTokens)" -ForegroundColor Green
}

if (-not $hasClose) {
  Write-Host "⚠️  WARNING: Stream did not complete (no 'complete' event)" -ForegroundColor Yellow
} else {
  Write-Host "✅ PASS: Stream completed successfully" -ForegroundColor Green
}

Write-Host ""
if ($success -and $tokenCount -ge $ExpectedTokens -and $hasClose) {
  Write-Host "✅ Mock SSE stream is working correctly!" -ForegroundColor Green
  Write-Host "   No env vars or server restart required!" -ForegroundColor Gray
  Write-Host "   You can now run Gate D metrics smoke test." -ForegroundColor Gray
  exit 0
} else {
  Write-Host "❌ Mock SSE stream test failed. Check server logs and configuration." -ForegroundColor Red
  Write-Host ""
  Write-Host "Quick debug:" -ForegroundColor Yellow
  Write-Host "  - Verify NODE_ENV=development (check: Get-Content apps/web-next/.env.local)" -ForegroundColor Gray
  Write-Host "  - Check server is running: Invoke-WebRequest http://127.0.0.1:3003" -ForegroundColor Gray
  Write-Host "  - Try header mode: .\tools\gate-d-test-mock-sse.ps1 -UseHeader" -ForegroundColor Gray
  exit 1
}


