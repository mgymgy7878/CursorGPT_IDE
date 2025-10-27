@echo off
echo 🚀 Spark Platform Server Başlatılıyor...
cd /d "C:\dev\CursorGPT_IDE\apps\web-next"
echo 📍 Dizin: %CD%
echo 🌐 Server: http://localhost:3015
echo ⏹️  Durdurmak için Ctrl+C
echo.
pnpm dev -- -p 3015
pause
