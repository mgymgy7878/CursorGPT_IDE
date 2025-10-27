@echo off
title Spark Platform - Direct
color 0A

echo.
echo ========================================
echo        SPARK PLATFORM DIRECT
echo ========================================
echo.
echo Chrome'da direkt aciliyor...
echo Port kontrolu yok!
echo ========================================
echo.

cd /d "C:\dev\CursorGPT_IDE\apps\web-next"

echo Next.js server baslatiliyor (arka planda)...
start /min "Spark Server" cmd /c "pnpm dev -- -p 3015"

echo 10 saniye bekleniyor...
timeout /t 10 /nobreak >nul

echo Chrome masaustu uygulamasi aciliyor...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3015 --window-size=1366,900 --disable-web-security --user-data-dir="%TEMP%\spark-direct-%RANDOM%" --no-first-run --no-default-browser-check --disable-background-timer-throttling --disable-renderer-backgrounding

echo.
echo Spark Platform masaustu uygulamasi acildi!
echo.
echo Bu pencereyi kapatabilirsiniz.
echo Server arka planda calisacak.
echo.
echo Durdurmak icin: spark-stop.bat
echo.
pause

