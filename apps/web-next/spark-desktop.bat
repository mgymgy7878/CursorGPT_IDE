@echo off
title Spark Platform Desktop
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    SPARK PLATFORM DESKTOP                   ║
echo  ║                                                              ║
echo  ║  🚀 Next.js Server + Chrome Desktop Wrapper                 ║
echo  ║  📍 Port: 3015                                              ║
echo  ║  🎨 Edit Mode: Ctrl+Shift+I (DevTools)                      ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "C:\dev\CursorGPT_IDE\apps\web-next"

echo 🔍 Port kontrolü yapılıyor...
netstat -an | findstr :3015 >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 3015 zaten kullanımda. Temizleniyor...
    npx kill-port 3015
    timeout /t 2 /nobreak >nul
)

echo 📦 Next.js server başlatılıyor...
start /min "Spark Server" cmd /c "pnpm dev -- -p 3015"

echo ⏳ Server'ın hazır olması bekleniyor...
:wait
timeout /t 3 /nobreak >nul
curl -s http://localhost:3015/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⏳ Hala bekleniyor...
    goto wait
)

echo ✅ Server hazır!
echo 🌐 Chrome Desktop uygulaması açılıyor...

REM Chrome'u desktop app olarak aç
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
    --app=http://localhost:3015 ^
    --window-size=1366,900 ^
    --disable-web-security ^
    --disable-features=VizDisplayCompositor ^
    --user-data-dir="%TEMP%\spark-desktop"

echo.
echo 🎉 Spark Platform Desktop başlatıldı!
echo.
echo 📋 Kullanım:
echo    • F12: DevTools aç/kapat
echo    • Ctrl+Shift+I: DevTools
echo    • Ctrl+R: Sayfa yenile
echo    • Ctrl+W: Uygulama kapat
echo.
echo ⚠️  Bu pencereyi kapatmayın! Server burada çalışıyor.
echo.
pause
