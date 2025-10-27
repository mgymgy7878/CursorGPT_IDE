# Process Manager Script for Spark Platform (Windows)
# Handles auto-restart and monitoring

Write-Host "🚀 Starting Spark Platform Development Server..." -ForegroundColor Green

# Kill any existing processes on port 3003
Write-Host "🔍 Checking for existing processes..." -ForegroundColor Yellow
$existing = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "⚠️  Found existing process on port 3003, terminating..." -ForegroundColor Yellow
    $existing | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }
    Start-Sleep -Seconds 2
}

# Set memory limits
$env:NODE_OPTIONS = "--max-old-space-size=4096"

Write-Host "📦 Starting Next.js development server..." -ForegroundColor Cyan

# Function to start server
function Start-DevServer {
    try {
        pnpm dev
    } catch {
        Write-Host "❌ Server crashed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "🔄 Restarting in 5 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        Start-DevServer
    }
}

# Start the server
Start-DevServer
