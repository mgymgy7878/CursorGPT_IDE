@echo off
setlocal EnableExtensions
set OUT=docs\evidence\dev\v2.2-ui

echo [1/7] rescue:ui
pnpm rescue:ui || goto :fail

echo [2/7] dev:core-safe-win
pnpm dev:core-safe-win || goto :fail

echo [3/7] smoke:core-plus
pnpm smoke:core-plus || goto :fail

echo [4/7] smoke:confirm
pnpm smoke:confirm || goto :fail

echo [5/7] smoke:ui-v2.2
pnpm smoke:ui-v2.2 || goto :fail

echo [6/7] evidence:snapshot
pnpm evidence:snapshot || goto :fail

echo [7/7] Rapor olusturuluyor...
node scripts/evidence/make-stage-report.mjs --base "%OUT%" || goto :fail

echo [OPEN] UI aciliyor...
pnpm open:ui >nul 2>nul

echo [OK] Tamam. Rapor: %OUT%\REPORT_latest.md
exit /b 0

:fail
echo [ERROR] Go-GREEN kosusu basarisiz. Son run klasoru ve loglari kontrol edin: %OUT%\run_*
exit /b 1
