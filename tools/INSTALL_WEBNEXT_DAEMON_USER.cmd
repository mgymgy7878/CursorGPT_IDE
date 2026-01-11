@echo off
setlocal

REM --- repo root'a git
cd /d "%~dp0.."

set "TASK=Spark-WebNext-Daemon-User"
set "CMD=%CD%\tools\WEBNEXT_DAEMON.cmd"

echo [install] Creating user logon task: %TASK%
schtasks /Delete /TN "%TASK%" /F >nul 2>nul

REM Run only when user is logged on -> password istemez, admin istemez
REM /RL LIMITED = normal user privileges (no admin needed)
schtasks /Create /F ^
  /TN "%TASK%" ^
  /SC ONLOGON ^
  /DELAY 0000:20 ^
  /RL LIMITED ^
  /TR "cmd.exe /c \"\"%CMD%\"\""

if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Failed to create task. Error: %ERRORLEVEL%
  pause
  exit /b 1
)

echo [install] OK. Starting task now...
schtasks /Run /TN "%TASK%" >nul

echo [verify] Waiting 15s...
timeout /t 15 /nobreak >nul
netstat -ano | findstr :3003

if %errorlevel%==0 (
  echo.
  echo [SUCCESS] Port 3003 is listening!
  echo   http://127.0.0.1:3003/dashboard
) else (
  echo.
  echo [WARNING] Port 3003 not listening yet.
  echo   Check: tools\HEALTH_WEBNEXT.cmd
  echo   Or: type tools\logs\webnext_daemon.log
)

echo.
echo Done.
endlocal

