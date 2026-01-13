@echo off
setlocal

REM === Spark WebNext Production Server Auto-Starter ===
REM Daha stabil çalışma için production build kullanır
REM Önce build yapılmalı: pnpm --filter web-next build

REM === repo path'ini kendine göre düzelt ===
set "REPO=C:\dev\CursorGPT_IDE"

cd /d "%REPO%" || exit /b 1

REM log klasörü
if not exist "%REPO%\logs" mkdir "%REPO%\logs"

REM Timestamp ile log başlığı
echo ======================================== >> "%REPO%\logs\web-next-prod.out.log"
echo [%date% %time%] Starting web-next production server >> "%REPO%\logs\web-next-prod.out.log"
echo ======================================== >> "%REPO%\logs\web-next-prod.out.log"

REM Build kontrolü (opsiyonel - ilk çalıştırmada build yoksa hata verir)
if not exist "%REPO%\apps\web-next\.next" (
  echo [%date% %time%] WARNING: .next folder not found, build may be required >> "%REPO%\logs\web-next-prod.err.log"
  echo [%date% %time%] Run: pnpm --filter web-next build >> "%REPO%\logs\web-next-prod.err.log"
)

REM pnpm PATH'ini dinamik bul (fnm/nvm/global install desteği)
set "PNPM="
for /f "delims=" %%i in ('where.exe pnpm 2^>nul') do set "PNPM=%%i"

if "%PNPM%"=="" (
  REM pnpm bulunamadı, PATH'te olabilir (son çare)
  echo [%date% %time%] WARNING: pnpm not found in PATH, trying direct call >> "%REPO%\logs\web-next-prod.err.log"
  call pnpm --filter web-next start -- --hostname 127.0.0.1 --port 3003 ^
    1>>"%REPO%\logs\web-next-prod.out.log" ^
    2>>"%REPO%\logs\web-next-prod.err.log"
) else (
  REM pnpm bulundu, absolute path ile çağır
  echo [%date% %time%] Using pnpm: %PNPM% >> "%REPO%\logs\web-next-prod.out.log"
  call "%PNPM%" --filter web-next start -- --hostname 127.0.0.1 --port 3003 ^
    1>>"%REPO%\logs\web-next-prod.out.log" ^
    2>>"%REPO%\logs\web-next-prod.err.log"
)

REM Eğer buraya geldiysek, server durdu (crash/exit)
echo [%date% %time%] Server stopped >> "%REPO%\logs\web-next-prod.out.log"
