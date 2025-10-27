@echo off
setlocal
set "EXEC_BASE=%~1"
if "%EXEC_BASE%"=="" set "EXEC_BASE=http://127.0.0.1:4001"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0smoke-futures.ps1" -Base "%EXEC_BASE%"
set ERR=%ERRORLEVEL%
if not "%ERR%"=="0" (
  echo Smoke FAILED (exit %ERR%)
  exit /b %ERR%
)
echo Smoke OK
exit /b 0
