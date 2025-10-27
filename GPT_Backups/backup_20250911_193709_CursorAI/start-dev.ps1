# AI Trading Supervisor - PowerShell Otomatik Başlatma
Write-Host "AI Trading Supervisor - Otomatik Başlatma" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Write-Host ""
Write-Host "1. Node.js süreçlerini sonlandırılıyor..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null

Write-Host ""
Write-Host "2. Build cache temizleniyor..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "3. Uygulama başlatılıyor (Port 3001)..." -ForegroundColor Yellow
npm run dev

Write-Host ""
Write-Host "Uygulama başlatıldı! Tarayıcınızda http://localhost:3001 adresini açın." -ForegroundColor Green
Read-Host "Devam etmek için Enter'a basın" 