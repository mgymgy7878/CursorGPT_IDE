# CSP/COEP Smoke Test Script
# Tests third-party resource loading with security headers
# Run before production deployment

param(
    [string]$BaseUrl = "http://127.0.0.1:3003",
    [switch]$Verbose = $false
)

Write-Host "🔒 CSP/COEP Smoke Test" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host ""

# Test results
$Results = @{
    Passed = 0
    Failed = 0
    Warnings = 0
    Tests = @()
}

function Test-Header {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedHeader,
        [string]$ExpectedValue = $null
    )
    
    try {
        $Response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 10
        $HeaderValue = $Response.Headers[$ExpectedHeader]
        
        if ($HeaderValue) {
            if ($ExpectedValue -and $HeaderValue -notlike "*$ExpectedValue*") {
                $Results.Failed++
                $Results.Tests += @{
                    Name = $Name
                    Status = "FAIL"
                    Message = "Header '$ExpectedHeader' found but value doesn't match expected pattern"
                    Expected = $ExpectedValue
                    Actual = $HeaderValue
                }
                Write-Host "❌ $Name" -ForegroundColor Red
            } else {
                $Results.Passed++
                $Results.Tests += @{
                    Name = $Name
                    Status = "PASS"
                    Message = "Header '$ExpectedHeader' present and valid"
                    Value = $HeaderValue
                }
                Write-Host "✅ $Name" -ForegroundColor Green
            }
        } else {
            $Results.Failed++
            $Results.Tests += @{
                Name = $Name
                Status = "FAIL"
                Message = "Header '$ExpectedHeader' not found"
            }
            Write-Host "❌ $Name" -ForegroundColor Red
        }
    } catch {
        $Results.Failed++
        $Results.Tests += @{
            Name = $Name
            Status = "FAIL"
            Message = "Request failed: $($_.Exception.Message)"
        }
        Write-Host "❌ $Name" -ForegroundColor Red
    }
}

function Test-ThirdPartyResource {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedCSP = $null
    )
    
    try {
        $Response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 5
        $CSP = $Response.Headers['Content-Security-Policy']
        
        if ($CSP) {
            if ($ExpectedCSP -and $CSP -notlike "*$ExpectedCSP*") {
                $Results.Warnings++
                $Results.Tests += @{
                    Name = $Name
                    Status = "WARN"
                    Message = "CSP present but may block third-party resource"
                    CSP = $CSP
                }
                Write-Host "⚠️  $Name" -ForegroundColor Yellow
            } else {
                $Results.Passed++
                $Results.Tests += @{
                    Name = $Name
                    Status = "PASS"
                    Message = "Resource accessible with current CSP"
                }
                Write-Host "✅ $Name" -ForegroundColor Green
            }
        } else {
            $Results.Warnings++
            $Results.Tests += @{
                Name = $Name
                Status = "WARN"
                Message = "No CSP header found - security risk"
            }
            Write-Host "⚠️  $Name" -ForegroundColor Yellow
        }
    } catch {
        $Results.Warnings++
        $Results.Tests += @{
            Name = $Name
            Status = "WARN"
            Message = "Third-party resource not accessible: $($_.Exception.Message)"
        }
        Write-Host "⚠️  $Name" -ForegroundColor Yellow
    }
}

# Test 1: Security Headers
Write-Host "🔐 Testing Security Headers..." -ForegroundColor Cyan

Test-Header -Name "CSP Header" -Url "$BaseUrl" -ExpectedHeader "Content-Security-Policy" -ExpectedValue "default-src"
Test-Header -Name "HSTS Header" -Url "$BaseUrl" -ExpectedHeader "Strict-Transport-Security" -ExpectedValue "max-age"
Test-Header -Name "COEP Header" -Url "$BaseUrl" -ExpectedHeader "Cross-Origin-Embedder-Policy" -ExpectedValue "require-corp"
Test-Header -Name "COOP Header" -Url "$BaseUrl" -ExpectedHeader "Cross-Origin-Opener-Policy" -ExpectedValue "same-origin"
Test-Header -Name "CORP Header" -Url "$BaseUrl" -ExpectedHeader "Cross-Origin-Resource-Policy" -ExpectedValue "same-origin"

Write-Host ""

# Test 2: Third-Party Resources (if any)
Write-Host "🌐 Testing Third-Party Resources..." -ForegroundColor Cyan

# Common third-party resources that might be used
$ThirdPartyResources = @(
    @{ Name = "Google Analytics"; Url = "https://www.google-analytics.com/analytics.js" },
    @{ Name = "Google Fonts"; Url = "https://fonts.googleapis.com/css2" },
    @{ Name = "CDN jQuery"; Url = "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js" },
    @{ Name = "Bootstrap CDN"; Url = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" }
)

foreach ($Resource in $ThirdPartyResources) {
    Test-ThirdPartyResource -Name $Resource.Name -Url $Resource.Url
}

Write-Host ""

# Test 3: API Endpoints with Security Headers
Write-Host "🔌 Testing API Endpoints..." -ForegroundColor Cyan

$ApiEndpoints = @(
    "/api/healthz",
    "/api/public/metrics.prom",
    "/api/public/btcturk/ticker"
)

foreach ($Endpoint in $ApiEndpoints) {
    Test-Header -Name "API $Endpoint" -Url "$BaseUrl$Endpoint" -ExpectedHeader "X-Content-Type-Options" -ExpectedValue "nosniff"
}

Write-Host ""

# Test 4: Static Assets
Write-Host "📁 Testing Static Assets..." -ForegroundColor Cyan

$StaticAssets = @(
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml"
)

foreach ($Asset in $StaticAssets) {
    try {
        $Response = Invoke-WebRequest -Uri "$BaseUrl$Asset" -Method GET -UseBasicParsing -TimeoutSec 5
        $Results.Passed++
        $Results.Tests += @{
            Name = "Static $Asset"
            Status = "PASS"
            Message = "Static asset accessible"
        }
        Write-Host "✅ Static $Asset" -ForegroundColor Green
    } catch {
        $Results.Warnings++
        $Results.Tests += @{
            Name = "Static $Asset"
            Status = "WARN"
            Message = "Static asset not found (may be normal)"
        }
        Write-Host "⚠️  Static $Asset" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 5: CORS Headers
Write-Host "🌍 Testing CORS Configuration..." -ForegroundColor Cyan

try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl" -Method OPTIONS -UseBasicParsing -TimeoutSec 5
    $CORS = $Response.Headers['Access-Control-Allow-Origin']
    
    if ($CORS) {
        $Results.Passed++
        $Results.Tests += @{
            Name = "CORS Headers"
            Status = "PASS"
            Message = "CORS headers present"
            Value = $CORS
        }
        Write-Host "✅ CORS Headers" -ForegroundColor Green
    } else {
        $Results.Warnings++
        $Results.Tests += @{
            Name = "CORS Headers"
            Status = "WARN"
            Message = "No CORS headers found"
        }
        Write-Host "⚠️  CORS Headers" -ForegroundColor Yellow
    }
} catch {
    $Results.Warnings++
    $Results.Tests += @{
        Name = "CORS Headers"
        Status = "WARN"
        Message = "OPTIONS request failed: $($_.Exception.Message)"
    }
    Write-Host "⚠️  CORS Headers" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Passed: $($Results.Passed)" -ForegroundColor Green
Write-Host "❌ Failed: $($Results.Failed)" -ForegroundColor Red
Write-Host "⚠️  Warnings: $($Results.Warnings)" -ForegroundColor Yellow
Write-Host ""

# Detailed results
if ($Verbose) {
    Write-Host "📋 Detailed Results:" -ForegroundColor Cyan
    foreach ($Test in $Results.Tests) {
        $Status = switch ($Test.Status) {
            "PASS" { "✅" }
            "FAIL" { "❌" }
            "WARN" { "⚠️ " }
        }
        Write-Host "$Status $($Test.Name): $($Test.Message)" -ForegroundColor White
        if ($Test.Value) {
            Write-Host "   Value: $($Test.Value)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

# Recommendations
Write-Host "💡 Recommendations:" -ForegroundColor Cyan
Write-Host "• Ensure CSP allows required third-party resources" -ForegroundColor White
Write-Host "• Test with actual third-party integrations" -ForegroundColor White
Write-Host "• Monitor browser console for CSP violations" -ForegroundColor White
Write-Host "• Consider nonce-based CSP for dynamic content" -ForegroundColor White
Write-Host ""

# Exit code
if ($Results.Failed -gt 0) {
    Write-Host "❌ Smoke test FAILED - Security issues detected" -ForegroundColor Red
    exit 1
} elseif ($Results.Warnings -gt 0) {
    Write-Host "⚠️  Smoke test PASSED with warnings" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "✅ Smoke test PASSED - All security headers present" -ForegroundColor Green
    exit 0
}
