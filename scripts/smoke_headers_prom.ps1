# Smoke Test - Prometheus & YAML Headers
# Quick validation of Content-Type compliance

param(
    [int]$Port = 3003,
    [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "SilentlyContinue"
$base = "http://${HostName}:${Port}"

# Test Prometheus endpoint
try {
    $prom = Invoke-WebRequest "${base}/api/public/metrics.prom" -UseBasicParsing -TimeoutSec 5
    $ctypeProm = $prom.Headers['Content-Type']
} catch {
    $ctypeProm = "ERROR: $_"
}

# Test YAML endpoint (if exists)
try {
    $yaml = Invoke-WebRequest "${base}/test.yaml" -UseBasicParsing -TimeoutSec 5
    $ctypeYaml = $yaml.Headers['Content-Type']
} catch {
    $ctypeYaml = "NOT_AVAILABLE"
}

# Output (two lines for CI parsing)
Write-Host "ctype_prom: $ctypeProm"
Write-Host "ctype_yaml: $ctypeYaml"

# Validation
$promOk = $ctypeProm -eq "text/plain; version=0.0.4; charset=utf-8"
$yamlOk = ($ctypeYaml -eq "application/yaml") -or ($ctypeYaml -eq "NOT_AVAILABLE")

if ($promOk -and $yamlOk) {
    Write-Host "SMOKE: PASS" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SMOKE: FAIL" -ForegroundColor Red
    if (-not $promOk) {
        Write-Host "  - Prometheus Content-Type incorrect" -ForegroundColor Yellow
    }
    if (-not $yamlOk -and $ctypeYaml -ne "NOT_AVAILABLE") {
        Write-Host "  - YAML Content-Type incorrect: $ctypeYaml" -ForegroundColor Yellow
    }
    exit 1
}

