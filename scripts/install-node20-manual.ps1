# scripts/install-node20-manual.ps1 - Manual Node 20.10.0 setup
$ErrorActionPreference = "Stop"

Write-Host "Node 20.10.0 Manual Installation Guide" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`n1. Download Node.js 20.10.0:" -ForegroundColor Yellow
Write-Host "   https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi" -ForegroundColor White

Write-Host "`n2. Run the installer manually:" -ForegroundColor Yellow
Write-Host "   - Double-click the downloaded MSI file" -ForegroundColor White
Write-Host "   - Follow the installation wizard" -ForegroundColor White
Write-Host "   - Accept default settings" -ForegroundColor White

Write-Host "`n3. After installation, restart PowerShell and run:" -ForegroundColor Yellow
Write-Host "   node -v  # Should show v20.10.0" -ForegroundColor White

Write-Host "`n4. Then continue with:" -ForegroundColor Yellow
Write-Host "   powershell -ExecutionPolicy Bypass -File .\scripts\fix-node-and-build-v2.ps1" -ForegroundColor White

Write-Host "`nAlternative: Use winget (if available):" -ForegroundColor Green
Write-Host "winget install OpenJS.NodeJS.LTS" -ForegroundColor White

Write-Host "`nCurrent Node version: $(node -v)" -ForegroundColor Cyan
