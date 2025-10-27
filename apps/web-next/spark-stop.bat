@echo off
title Spark Platform - Stop
color 0C

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                SPARK PLATFORM - STOP                        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🛑 Spark Platform durduruluyor...

echo 📍 Port 3015 temizleniyor...
npx kill-port 3015

echo 🔄 Chrome Spark uygulamaları kapatılıyor...
taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq Spark Platform Desktop" 2>nul
taskkill /F /IM chrome.exe /FI "COMMANDLINE eq *--app=http://localhost:3015*" 2>nul
taskkill /F /IM chrome.exe /FI "COMMANDLINE eq *spark-desktop*" 2>nul

echo 🔄 Node.js process'leri temizleniyor...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Spark Server" 2>nul

echo ✅ Spark Platform durduruldu!
echo.
pause