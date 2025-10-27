@echo off
title Spark Platform
color 0A

echo.
echo    ╔══════════════════════════════════════════════════════════════╗
echo    ║                    SPARK PLATFORM                           ║
echo    ║                                                              ║
echo    ║  🚀 Next.js Server + Chrome Desktop                         ║
echo    ║  📍 Port: 3015                                              ║
echo    ║  🎨 DevTools: F12                                           ║
echo    ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "C:\dev\CursorGPT_IDE\apps\web-next"

echo 🔍 Port temizleniyor...
npx kill-port 3015 >nul 2>&1

echo 📦 Next.js server başlatılıyor...
start /min "Spark Server" cmd /c "pnpm dev -- -p 3015"

echo ⏳ Server hazır olana kadar bekleniyor...
:wait
timeout /t 2 /nobreak >nul
curl -s http://localhost:3015/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⏳ Bekleniyor...
    goto wait
)

echo ✅ Server hazır!
echo 🌐 Chrome Desktop açılıyor...

REM Chrome'u desktop app olarak aç
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3015 --window-size=1366,900 --disable-web-security --user-data-dir="%TEMP%\spark-desktop"

echo.
echo 🎉 Spark Platform başlatıldı!
echo.
echo 📋 Kontroller:
echo    • F12: DevTools aç/kapat
echo    • Ctrl+R: Sayfa yenile
echo    • Ctrl+W: Uygulama kapat
echo.
echo ⚠️  Bu pencereyi kapatmayın!
echo.
pause
