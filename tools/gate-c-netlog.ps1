# Gate C NetLog Capture Script
# Captures network logs for objective SSE connection verification

$ErrorActionPreference = "Stop"

Write-Host "=== Gate C NetLog Capture ===" -ForegroundColor Cyan

# Create artifacts directory
$netlogDir = "artifacts/netlog"
if (-not (Test-Path $netlogDir)) {
    New-Item -ItemType Directory -Path $netlogDir -Force | Out-Null
    Write-Host "Created directory: $netlogDir" -ForegroundColor Green
}

# Generate timestamp for filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$netlogFile = "$netlogDir/gateC_netlog_$timestamp.json"

Write-Host "`nNetLog will be saved to: $netlogFile" -ForegroundColor Yellow

# Detect browser
$edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$chromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"

$browserPath = $null
$browserName = ""

if (Test-Path $edgePath) {
    $browserPath = $edgePath
    $browserName = "Edge"
    Write-Host "Using Microsoft Edge" -ForegroundColor Green
} elseif (Test-Path $chromePath) {
    $browserPath = $chromePath
    $browserName = "Chrome"
    Write-Host "Using Google Chrome" -ForegroundColor Green
} else {
    Write-Host "ERROR: Edge or Chrome not found!" -ForegroundColor Red
    Write-Host "Please install Microsoft Edge or Google Chrome" -ForegroundColor Yellow
    exit 1
}

# Start browser with NetLog flags
Write-Host "`nStarting $browserName with NetLog capture..." -ForegroundColor Yellow
Write-Host "URL: http://localhost:3003" -ForegroundColor Gray
Write-Host "NetLog file: $netlogFile" -ForegroundColor Gray

$arguments = @(
    "--log-net-log=$netlogFile",
    "--net-log-capture-mode=Everything",
    "http://localhost:3003"
)

Start-Process -FilePath $browserPath -ArgumentList $arguments

Write-Host "`n✅ Browser started with NetLog capture" -ForegroundColor Green
Write-Host "`nInstructions:" -ForegroundColor Cyan
Write-Host "1. Perform Gate C smoke tests in the browser" -ForegroundColor Gray
Write-Host "2. Close browser when done (NetLog will be finalized)" -ForegroundColor Gray
Write-Host "3. NetLog file will be saved to: $netlogFile" -ForegroundColor Gray
Write-Host "`nTo analyze NetLog:" -ForegroundColor Cyan
Write-Host "- Open: https://netlog-viewer.appspot.com/" -ForegroundColor Gray
Write-Host "- Upload the NetLog JSON file" -ForegroundColor Gray
Write-Host "- Filter: event-stream or api/copilot/chat" -ForegroundColor Gray
Write-Host "- Verify: Only ONE SSE connection" -ForegroundColor Green

