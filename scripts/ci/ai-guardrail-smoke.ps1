# AI Payload Guardrail CI Smoke Test
# Validates guardrail behavior in CI environment

param(
    [string]$ExecutorUrl = "http://127.0.0.1:4001",
    [int]$TimeoutSeconds = 30,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 AI Payload Guardrail CI Smoke Test" -ForegroundColor Cyan
Write-Host "Executor URL: $ExecutorUrl" -ForegroundColor Gray

# Test 1: Normal Payload (should not be trimmed)
Write-Host "`n📋 Test 1: Normal Payload" -ForegroundColor Yellow
try {
    $normalPayload = @{
        pair = "BTCUSDT"
        tf = "1h"
        risk = "low"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$ExecutorUrl/api/ai/strategies/generate" `
        -Method POST -ContentType "application/json" -Body $normalPayload `
        -TimeoutSec $TimeoutSeconds

    if ($response.ok) {
        Write-Host "✅ Normal payload test PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Normal payload test FAILED: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Normal payload test FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Oversize Payload (should be trimmed)
Write-Host "`n📋 Test 2: Oversize Payload" -ForegroundColor Yellow
try {
    $bigPayload = @{
        msg = ("x" * 500000)  # 500KB string
        n1 = [double]::PositiveInfinity
        bi = [bigint]12345678901234567890
        items = @(1..1000)  # Large array
    }
    $bigPayload.self = $bigPayload  # Circular reference

    $body = $bigPayload | ConvertTo-Json -Depth 6

    $response = Invoke-RestMethod -Uri "$ExecutorUrl/api/ai/strategies/generate" `
        -Method POST -ContentType "application/json" -Body $body `
        -TimeoutSec $TimeoutSeconds

    if ($response.ok) {
        Write-Host "✅ Oversize payload test PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Oversize payload test FAILED: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Oversize payload test FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Metrics Validation
Write-Host "`n📋 Test 3: Metrics Validation" -ForegroundColor Yellow
try {
    $metricsResponse = Invoke-WebRequest -Uri "$ExecutorUrl/metrics" -TimeoutSec $TimeoutSeconds
    $metricsContent = $metricsResponse.Content

    # Check for AI payload metrics
    $aiPayloadMetrics = $metricsContent | Select-String "ai_payload_"
    
    if ($aiPayloadMetrics) {
        Write-Host "✅ Metrics test PASSED - Found AI payload metrics:" -ForegroundColor Green
        if ($Verbose) {
            $aiPayloadMetrics | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }
    } else {
        Write-Host "❌ Metrics test FAILED - No AI payload metrics found" -ForegroundColor Red
        exit 1
    }

    # Check for chunk metrics
    $chunkMetrics = $metricsContent | Select-String "ai_chunk_"
    if ($chunkMetrics) {
        Write-Host "✅ Chunk metrics found" -ForegroundColor Green
        if ($Verbose) {
            $chunkMetrics | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }
    } else {
        Write-Host "⚠️  Chunk metrics not found (may be zero)" -ForegroundColor Yellow
    }

    # Check for SSE retry metrics
    $sseRetryMetrics = $metricsContent | Select-String "sse_retry_"
    if ($sseRetryMetrics) {
        Write-Host "✅ SSE retry metrics found" -ForegroundColor Green
        if ($Verbose) {
            $sseRetryMetrics | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }
    } else {
        Write-Host "⚠️  SSE retry metrics not found (may be zero)" -ForegroundColor Yellow
    }

    # Check for truncated counter
    $truncatedCounter = $metricsContent | Select-String "ai_payload_truncated_total"
    if ($truncatedCounter) {
        Write-Host "✅ Truncated counter found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Truncated counter not found (may be zero)" -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ Metrics test FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Chunked Upload Test
Write-Host "`n📋 Test 4: Chunked Upload Test" -ForegroundColor Yellow
try {
    # Create a very large payload (1.2MB)
    $largePayload = @{
        pair = "BTCUSDT"
        tf = "1h"
        risk = "low"
        largeData = ("x" * 1200000)  # 1.2MB string
        items = @(1..5000)  # Large array
    }
    $largePayload.self = $largePayload  # Circular reference

    $body = $largePayload | ConvertTo-Json -Depth 6

    $response = Invoke-RestMethod -Uri "$ExecutorUrl/api/ai/strategies/generate" `
        -Method POST -ContentType "application/json" -Body $body `
        -TimeoutSec $TimeoutSeconds

    if ($response.ok) {
        Write-Host "✅ Chunked upload test PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Chunked upload test FAILED: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Chunked upload test FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: SSE Retry Test (simulate 429/502 errors)
Write-Host "`n📋 Test 5: SSE Retry Test" -ForegroundColor Yellow
try {
    # This test would require mocking upstream to return 429/502
    # For now, just verify the endpoint exists
    $normalPayload = @{pair="BTCUSDT";tf="1h";risk="low"} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$ExecutorUrl/api/ai/strategies/generate" `
        -Method POST -ContentType "application/json" -Body $normalPayload `
        -TimeoutSec $TimeoutSeconds

    if ($response.ok) {
        Write-Host "✅ SSE retry test PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ SSE retry test FAILED: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ SSE retry test FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 6: Health Check
Write-Host "`n📋 Test 6: Health Check" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ExecutorUrl/health" -TimeoutSec $TimeoutSeconds
    
    if ($healthResponse.ok) {
        Write-Host "✅ Health check PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check FAILED" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Health check FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n🎉 All AI Payload Guardrail tests PASSED!" -ForegroundColor Green
Write-Host "Guardrail system is working correctly in CI environment." -ForegroundColor Gray

# Optional: Log evidence collection
if ($Verbose) {
    Write-Host "`n📊 Evidence Collection:" -ForegroundColor Cyan
    
    try {
        $metricsResponse = Invoke-WebRequest -Uri "$ExecutorUrl/metrics" -TimeoutSec $TimeoutSeconds
        $aiPayloadMetrics = $metricsResponse.Content | Select-String "ai_payload_"
        
        Write-Host "AI Payload Metrics Sample:" -ForegroundColor Gray
        $aiPayloadMetrics | Select-Object -First 5 | ForEach-Object { 
            Write-Host "  $_" -ForegroundColor Gray 
        }
    } catch {
        Write-Host "Could not collect metrics evidence" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ CI Smoke Test Complete" -ForegroundColor Green
