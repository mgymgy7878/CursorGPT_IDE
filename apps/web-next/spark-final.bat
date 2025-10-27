@echo off
title Spark Platform - Final
color 0A

echo.
echo ========================================
echo        SPARK PLATFORM FINAL
echo ========================================
echo.
echo Temiz baslangic yapiliyor...
echo ========================================
echo.

cd /d "C:\dev\CursorGPT_IDE\apps\web-next"

echo Eski process'ler temizleniyor...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq *Spark*" 2>nul
npx kill-port 3003 2>nul
npx kill-port 3015 2>nul

echo 3 saniye bekleniyor...
timeout /t 3 /nobreak >nul

echo Next.js server baslatiliyor...
start /min "Spark Server" cmd /c "pnpm dev -- -p 3015"

echo 15 saniye bekleniyor (server hazir olana kadar)...
timeout /t 15 /nobreak >nul

echo Port kontrol ediliyor...
curl -s http://localhost:3015/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Server henuz hazir degil. 10 saniye daha bekleniyor...
    timeout /t 10 /nobreak >nul
)

echo Chrome masaustu uygulamasi aciliyor...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3015 --window-size=1366,900 --disable-web-security --user-data-dir="%TEMP%\spark-final-%RANDOM%" --no-first-run --no-default-browser-check

echo.
echo Spark Platform masaustu uygulamasi acildi!
echo.
echo Bu pencereyi kapatabilirsiniz.
echo Server arka planda calisacak.
echo.
echo Durdurmak icin: spark-stop.bat
echo.
pause

