@echo off
echo AI Trading Supervisor - Otomatik Başlatma
echo ==========================================

echo.
echo 1. Node.js süreçlerini sonlandırılıyor...
taskkill /f /im node.exe 2>nul

echo.
echo 2. Build cache temizleniyor...
if exist .next rmdir /s /q .next

echo.
echo 3. Uygulama başlatılıyor (Port 3001)...
npm run dev

echo.
echo Uygulama başlatıldı! Tarayıcınızda http://localhost:3001 adresini açın.
pause 