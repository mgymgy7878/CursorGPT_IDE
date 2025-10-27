# Parity Report Script
# Runs parity analysis between Binance and BTCTurk

Write-Host "⚖️ Parity Report Başlıyor..." -ForegroundColor Yellow

$evidenceDir = "evidence/local/archive"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Create evidence directory if not exists
if (!(Test-Path $evidenceDir)) {
    New-Item -ItemType Directory -Path $evidenceDir -Force
}

# Default parameters
$symbols = "BTCUSDT,ETHUSDT"
$duration = 300

# Parse command line arguments
for ($i = 0; $i -lt $args.Length; $i++) {
    if ($args[$i] -eq "--symbols" -and $i + 1 -lt $args.Length) {
        $symbols = $args[$i + 1]
    }
    if ($args[$i] -eq "--duration" -and $i + 1 -lt $args.Length) {
        $duration = [int]$args[$i + 1]
    }
}

Write-Host "📊 Parity Analysis Parameters:" -ForegroundColor Cyan
Write-Host "  Symbols: $symbols" -ForegroundColor White
Write-Host "  Duration: $duration seconds" -ForegroundColor White

# Change to analytics directory
Set-Location "services/analytics"

Write-Host "🔧 Building analytics service..." -ForegroundColor Cyan
try {
    pnpm build
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Running parity report..." -ForegroundColor Cyan
try {
    $startTime = Get-Date
    node dist/parity-report.js --symbols=$symbols --duration=$duration
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "✅ Parity report completed in $([math]::Round($duration, 2)) seconds" -ForegroundColor Green
} catch {
    Write-Host "❌ Parity report failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/parity_report_error_$timestamp.txt" -Encoding UTF8
    exit 1
}

# Check for generated files
$jsonFile = "$evidenceDir/parity-report.json"
$csvFile = "$evidenceDir/parity-report.csv"
$promFile = "$evidenceDir/parity-metrics.prom"

Write-Host "📁 Checking generated files..." -ForegroundColor Cyan

if (Test-Path $jsonFile) {
    $jsonSize = (Get-Item $jsonFile).Length
    Write-Host "✅ JSON report: $jsonFile ($jsonSize bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ JSON report not found" -ForegroundColor Red
}

if (Test-Path $csvFile) {
    $csvSize = (Get-Item $csvFile).Length
    Write-Host "✅ CSV report: $csvFile ($csvSize bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ CSV report not found" -ForegroundColor Red
}

if (Test-Path $promFile) {
    $promSize = (Get-Item $promFile).Length
    Write-Host "✅ Prometheus metrics: $promFile ($promSize bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ Prometheus metrics not found" -ForegroundColor Red
}

# Return to project root
Set-Location "../.."

Write-Host "🎉 Parity Report Tamamlandı!" -ForegroundColor Green
Write-Host "📁 Evidence dosyları: $evidenceDir" -ForegroundColor Yellow
