# UI Clean Script - Next.js cache temizleme ve dev server restart
# Kullanım: .\tools\ui-clean.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n=== UI CLEAN SCRIPT ===" -ForegroundColor Cyan

# 1. Dev server'ı durdur
Write-Host "`n1. Dev server durduruluyor..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   Dev server durduruldu" -ForegroundColor Green

# 2. .next cache temizle
Write-Host "`n2. .next cache temizleniyor..." -ForegroundColor Yellow
Remove-Item -Recurse -Force apps/web-next/.next -ErrorAction SilentlyContinue
Write-Host "   .next temizlendi" -ForegroundColor Green

# 3. node_modules/.cache temizle (opsiyonel ama önerilir)
Write-Host "`n3. node_modules/.cache temizleniyor..." -ForegroundColor Yellow
Remove-Item -Recurse -Force apps/web-next/node_modules/.cache -ErrorAction SilentlyContinue
Write-Host "   node_modules/.cache temizlendi" -ForegroundColor Green

# 4. Dev server başlat
Write-Host "`n4. Dev server baslatiliyor..." -ForegroundColor Yellow
Write-Host "   Komut: pnpm --filter web-next dev -- --hostname 127.0.0.1 --port 3003" -ForegroundColor Gray
Write-Host "`n   Dev server arka planda calisiyor..." -ForegroundColor Green
Write-Host "   Browser'da http://127.0.0.1:3003 adresini acin" -ForegroundColor Cyan
Write-Host "   Hard refresh yapin: Ctrl+Shift+R" -ForegroundColor Cyan

# Arka planda başlat
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm --filter web-next dev -- --hostname 127.0.0.1 --port 3003"

Write-Host "`n=== TAMAMLANDI ===" -ForegroundColor Green
