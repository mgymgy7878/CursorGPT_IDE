@echo off
setlocal enabledelayedexpansion
title [Spark] Final Production Tests (Windows)

if "%EXECUTOR_ORIGIN%"=="" set EXECUTOR_ORIGIN=http://localhost:4001
if "%NEXT_PUBLIC_EXECUTOR_ORIGIN%"=="" set NEXT_PUBLIC_EXECUTOR_ORIGIN=%EXECUTOR_ORIGIN%
set WEB_ORIGIN=http://localhost:3003

echo === ENV ===
echo EXECUTOR_ORIGIN=%EXECUTOR_ORIGIN%
echo NEXT_PUBLIC_EXECUTOR_ORIGIN=%NEXT_PUBLIC_EXECUTOR_ORIGIN%
echo WEB_ORIGIN=%WEB_ORIGIN%
echo.

set FAIL=0

echo [1/6] Backend Health...
powershell -NoProfile -Command "try{$r=Invoke-WebRequest -Uri '%EXECUTOR_ORIGIN%/public/health' -UseBasicParsing; if($r.StatusCode -eq 200 -and $r.Content -match '\"service\":\"executor\"'){exit 0}else{exit 1}}catch{exit 1}"
if errorlevel 1 (echo   FAIL & set FAIL=1) else (echo   OK)

echo [2/6] UI Local Health...
powershell -NoProfile -Command "try{$r=Invoke-WebRequest -Uri '%WEB_ORIGIN%/api/local/health' -UseBasicParsing; if($r.StatusCode -eq 200 -and $r.Content -match '\"service\":\"web-next\"'){exit 0}else{exit 1}}catch{exit 1}"
if errorlevel 1 (echo   FAIL & set FAIL=1) else (echo   OK)

echo [3/6] Proxy Health (rewrite)...
powershell -NoProfile -Command "try{$r=Invoke-WebRequest -Uri '%WEB_ORIGIN%/api/public/health' -UseBasicParsing; if($r.StatusCode -eq 200 -and $r.Content -match '\"service\":\"executor\"'){exit 0}else{exit 1}}catch{exit 1}"
if errorlevel 1 (echo   FAIL & set FAIL=1) else (echo   OK)

echo [4/6] POST Body Preservation...
powershell -NoProfile -Command ^
  "$b='{\"msg\":\"post-body-test\"}'; $u='%WEB_ORIGIN%/api/public/echo';" ^
  "try{$r=Invoke-WebRequest -Uri $u -Method POST -Body $b -ContentType 'application/json' -UseBasicParsing;" ^
  "if($r.StatusCode -eq 200 -and $r.Content -match 'post-body-test'){exit 0}else{exit 1}}catch{exit 1}"
if errorlevel 1 (echo   FAIL & set FAIL=1) else (echo   OK)

echo [5/6] Parity Render...
powershell -NoProfile -Command "try{$r=Invoke-WebRequest -Uri '%WEB_ORIGIN%/parity' -UseBasicParsing; if($r.StatusCode -eq 200){exit 0}else{exit 1}}catch{exit 1}"
if errorlevel 1 (echo   FAIL & set FAIL=1) else (echo   OK)

echo [6/6] Playwright Smoke (opsiyonel)...
pnpm -w exec playwright test -g "UI smoke" || echo   WARN: Smoke optional.

echo.
if %FAIL%==0 (echo PRODUCTION_READY=TRUE & exit /b 0) else (echo PRODUCTION_READY=FALSE & exit /b 1) 