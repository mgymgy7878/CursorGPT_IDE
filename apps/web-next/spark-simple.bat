@echo off
title Spark Platform
color 0A

echo.
echo ========================================
echo           SPARK PLATFORM
echo ========================================
echo.
echo Next.js Server + Chrome Desktop
echo Port: 3015
echo DevTools: F12
echo ========================================
echo.

cd /d "C:\dev\CursorGPT_IDE\apps\web-next"

echo Port temizleniyor...
npx kill-port 3015 >nul 2>&1
timeout /t 2 /nobreak >nul

echo Next.js server baslatiliyor...
start /min "Spark Server" cmd /c "pnpm dev -- -p 3015"

echo Server hazir olana kadar bekleniyor...
set /a count=0

:wait
set /a count+=1
if %count% gtr 30 (
    echo Server baslatilamadi! Manuel kontrol gerekli.
    pause
    exit /b 1
)

timeout /t 3 /nobreak >nul
curl -s http://localhost:3015/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Bekleniyor... (%count%/30)
    goto wait
)

echo Server hazir!
echo Chrome Desktop aciliyor...

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3015 --window-size=1366,900 --disable-web-security --user-data-dir="%TEMP%\spark-desktop-%RANDOM%"

echo.
echo Spark Platform baslatildi!
echo.
echo Kontroller:
echo    F12: DevTools ac/kapat
echo    Ctrl+R: Sayfa yenile
echo    Ctrl+W: Uygulama kapat
echo.
echo Bu pencereyi kapatmayin!
echo.
pause

