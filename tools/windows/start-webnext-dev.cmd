@echo off
setlocal enabledelayedexpansion

REM === Spark WebNext Dev Server Auto-Starter ===
REM Node'u registry'den bulup direkt node.exe ile Next.js çalıştırır
REM PATH bağımsız çalışma (fnm/nvm sorunlarını bypass eder)

REM === Repo root'u script konumundan kesin hesapla ===
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"
set "WEBNEXT=%REPO_ROOT%\apps\web-next"

REM log klasörü
if not exist "%REPO_ROOT%\logs" mkdir "%REPO_ROOT%\logs"

REM Timestamp ile log başlığı
echo ======================================== >> "%REPO_ROOT%\logs\web-next-dev.out.log"
echo [%date% %time%] Starting web-next dev server >> "%REPO_ROOT%\logs\web-next-dev.out.log"
echo ======================================== >> "%REPO_ROOT%\logs\web-next-dev.out.log"

REM === Port 3003 zaten dinleniyorsa çık (çift çalışmayı engelle) ===
netstat -ano 2>nul | findstr ":3003 " | findstr LISTENING >nul
if not errorlevel 1 (
  echo [%date% %time%] Port 3003 already listening. Exiting to prevent duplicate. >> "%REPO_ROOT%\logs\web-next-dev.out.log"
  exit /b 0
)

REM === Debug: Environment bilgileri ===
echo [%date% %time%] Environment check: >> "%REPO_ROOT%\logs\web-next-dev.out.log"
echo [%date% %time%] Repo root: %REPO_ROOT% >> "%REPO_ROOT%\logs\web-next-dev.out.log"
echo [%date% %time%] WebNext dir: %WEBNEXT% >> "%REPO_ROOT%\logs\web-next-dev.out.log"

REM === Find node.exe (PATH -> HKLM -> HKCU registry) ===
set "NODE_EXE="

REM 1. PATH'te ara
for /f "delims=" %%p in ('where.exe node 2^>nul') do (
  set "NODE_EXE=%%p"
  echo [%date% %time%] Node found in PATH: %%p >> "%REPO_ROOT%\logs\web-next-dev.out.log"
  goto :NODE_FOUND
)

REM 2. HKLM registry'den ara
for /f "tokens=2,*" %%A in ('reg query "HKLM\SOFTWARE\Node.js" /v InstallPath 2^>nul ^| find "InstallPath"') do set "NODE_DIR=%%B"
if defined NODE_DIR (
  if exist "%NODE_DIR%\node.exe" (
    set "NODE_EXE=%NODE_DIR%\node.exe"
    echo [%date% %time%] Node found in HKLM registry: %NODE_EXE% >> "%REPO_ROOT%\logs\web-next-dev.out.log"
    goto :NODE_FOUND
  )
)

REM 3. HKCU registry'den ara
for /f "tokens=2,*" %%A in ('reg query "HKCU\SOFTWARE\Node.js" /v InstallPath 2^>nul ^| find "InstallPath"') do set "NODE_DIR=%%B"
if defined NODE_DIR (
  if exist "%NODE_DIR%\node.exe" (
    set "NODE_EXE=%NODE_DIR%\node.exe"
    echo [%date% %time%] Node found in HKCU registry: %NODE_EXE% >> "%REPO_ROOT%\logs\web-next-dev.out.log"
    goto :NODE_FOUND
  )
)

REM Node bulunamadı
echo [%date% %time%] ERROR: node.exe not found (PATH + registry failed) >> "%REPO_ROOT%\logs\web-next-dev.err.log"
echo [%date% %time%] ERROR: node.exe not found (PATH + registry failed) >> "%REPO_ROOT%\logs\web-next-dev.out.log"
exit /b 1

:NODE_FOUND
REM === Next.js CLI path kontrolü ===
set "NEXT_CLI=%WEBNEXT%\node_modules\next\dist\bin\next"
if not exist "%NEXT_CLI%" (
  echo [%date% %time%] ERROR: Next CLI not found: %NEXT_CLI% >> "%REPO_ROOT%\logs\web-next-dev.err.log"
  echo [%date% %time%] ERROR: Next CLI not found: %NEXT_CLI% >> "%REPO_ROOT%\logs\web-next-dev.out.log"
  exit /b 1
)

REM === Node version kontrolü (debug) ===
"%NODE_EXE%" --version >nul 2>&1
if errorlevel 1 (
  echo [%date% %time%] WARNING: Node version check failed >> "%REPO_ROOT%\logs\web-next-dev.err.log"
) else (
  for /f "delims=" %%v in ('"%NODE_EXE%" --version') do echo [%date% %time%] Node version: %%v >> "%REPO_ROOT%\logs\web-next-dev.out.log"
)

REM === Next.js dev server'ı başlat (direkt node.exe ile) ===
echo [%date% %time%] Starting Next.js dev server... >> "%REPO_ROOT%\logs\web-next-dev.out.log"
echo [%date% %time%] Node: %NODE_EXE% >> "%REPO_ROOT%\logs\web-next-dev.out.log"
echo [%date% %time%] Next CLI: %NEXT_CLI% >> "%REPO_ROOT%\logs\web-next-dev.out.log"

cd /d "%WEBNEXT%" || (
  echo [%date% %time%] ERROR: Cannot cd to %WEBNEXT% >> "%REPO_ROOT%\logs\web-next-dev.err.log"
  exit /b 1
)

REM Direkt node.exe ile Next.js CLI çalıştır (pnpm/next.cmd bypass)
"%NODE_EXE%" "%NEXT_CLI%" dev --hostname 127.0.0.1 --port 3003 ^
  1>>"%REPO_ROOT%\logs\web-next-dev.out.log" ^
  2>>"%REPO_ROOT%\logs\web-next-dev.err.log"

REM Eğer buraya geldiysek, server durdu (crash/exit)
echo [%date% %time%] Server stopped >> "%REPO_ROOT%\logs\web-next-dev.out.log"
