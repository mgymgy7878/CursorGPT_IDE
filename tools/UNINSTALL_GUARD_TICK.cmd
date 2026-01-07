@echo off
setlocal EnableExtensions

echo [uninstall] Removing Tick Guard tasks...
echo.

set "T_LOGON=Spark-GuardTick-WebNext-Logon"
set "T_MIN=Spark-GuardTick-WebNext-Minute"

rem Logon task
schtasks /Delete /TN "%T_LOGON%" /F >nul 2>nul
if %errorlevel%==0 (
  echo [OK] Removed: %T_LOGON%
) else (
  echo [info] Task not found: %T_LOGON% (OK)
)

rem Minute task
schtasks /Delete /TN "%T_MIN%" /F >nul 2>nul
if %errorlevel%==0 (
  echo [OK] Removed: %T_MIN%
) else (
  echo [info] Task not found: %T_MIN% (OK)
)

echo.
echo [SUCCESS] Tick Guard uninstalled
echo.
pause

