@echo off
title Spark Platform - Standalone
color 0A

echo.
echo ========================================
echo        SPARK PLATFORM STANDALONE
echo ========================================
echo.
echo Gercek masaustu uygulamasi olarak baslatiliyor...
echo Port sorunlari yok!
echo ========================================
echo.

cd /d "C:\dev\CursorGPT_IDE\apps\web-next"

echo Next.js build ediliyor...
pnpm build

echo Standalone server baslatiliyor...
pnpm start -- -p 3015 &

echo 5 saniye bekleniyor...
timeout /t 5 /nobreak >nul

echo Chrome masaustu uygulamasi aciliyor...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3015 --window-size=1366,900 --disable-web-security --user-data-dir="%TEMP%\spark-standalone-%RANDOM%" --no-first-run --no-default-browser-check

echo.
echo Spark Platform masaustu uygulamasi baslatildi!
echo.
echo Bu pencereyi kapatabilirsiniz.
echo Uygulama bagimsiz olarak calisacak.
echo.
pause

