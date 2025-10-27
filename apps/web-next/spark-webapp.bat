@echo off
title Spark Platform - Web App
color 0A

echo.
echo ========================================
echo        SPARK PLATFORM WEB APP
echo ========================================
echo.
echo Chrome'da web uygulamasi olarak aciliyor...
echo Port sorunlari yok!
echo ========================================
echo.

cd /d "C:\dev\CursorGPT_IDE\apps\web-next"

echo Next.js development server baslatiliyor...
start /min "Spark Dev Server" cmd /c "pnpm dev -- -p 3015"

echo 8 saniye bekleniyor (server hazir olana kadar)...
timeout /t 8 /nobreak >nul

echo Chrome web uygulamasi aciliyor...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3015 --window-size=1366,900 --disable-web-security --user-data-dir="%TEMP%\spark-webapp-%RANDOM%" --no-first-run --no-default-browser-check

echo.
echo Spark Platform web uygulamasi baslatildi!
echo.
echo Bu pencereyi kapatabilirsiniz.
echo Server arka planda calisacak.
echo.
echo Durdurmak icin: spark-stop.bat
echo.
pause

