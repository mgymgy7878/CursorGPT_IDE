@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
cd /d "%ROOT%"

echo [install] Installing Tick Guard tasks for web-next
echo [install] Root: %ROOT%
echo.

rem Eski guard task varsa çakışmayı önlemek için sil
echo [cleanup] Removing old guard task (if exists)...
schtasks /Delete /TN "Spark-Guard-WebNext" /F >nul 2>nul
if %errorlevel%==0 (
  echo [OK] Old guard task removed
) else (
  echo [info] No old guard task found (OK)
)
echo.

set "T_LOGON=Spark-GuardTick-WebNext-Logon"
set "T_MIN=Spark-GuardTick-WebNext-Minute"
set "SCRIPT=%ROOT%\tools\SPARK_GUARD_TICK_WEBNEXT.cmd"

echo [install] Creating tick guard tasks...
echo.

rem Task 1: Logon + 20s delay (ilk kontrol)
echo [1/2] Creating logon trigger task...
schtasks /Create /F /RL HIGHEST /SC ONLOGON /DELAY 0000:20 /TN "%T_LOGON%" ^
  /TR "cmd.exe /d /c \"\"%SCRIPT%\"\""

if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Failed to create logon task. Error: %ERRORLEVEL%
  echo [info] Try running as Administrator
  pause
  exit /b 1
)
echo [OK] Logon task created: %T_LOGON%
echo.

rem Task 2: Her 1 dakikada bir (self-heal)
echo [2/2] Creating minute trigger task...
schtasks /Create /F /RL HIGHEST /SC MINUTE /MO 1 /TN "%T_MIN%" ^
  /TR "cmd.exe /d /c \"\"%SCRIPT%\"\""

if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Failed to create minute task. Error: %ERRORLEVEL%
  echo [info] Try running as Administrator
  pause
  exit /b 1
)
echo [OK] Minute task created: %T_MIN%
echo.

echo ========================================
echo [SUCCESS] Tick Guard installed!
echo ========================================
echo.
echo Installed tasks:
echo   ✅ %T_LOGON% (runs 20s after logon)
echo   ✅ %T_MIN% (runs every 1 minute)
echo.
echo [IMPORTANT] Task Scheduler Conditions ayarları:
echo   Her iki task için de şu ayarları YAPIN:
echo.
echo   Conditions tab:
echo     ☐ "Start the task only if the computer is on AC power" → KAPAT
echo     ☐ "Stop if the computer switches to battery power" → KAPAT
echo     ☐ "Start only if the following network connection is available" → KAPAT
echo.
echo   Settings tab:
echo     ✅ "If the task fails, restart every: 1 minute" (3 attempts)
echo     ☐ "Stop the task if it runs longer than: ..." → KAPAT
echo.
echo   General tab:
echo     ✅ "Run whether user is logged on or not" (recommended)
echo     ✅ "Run with highest privileges"
echo.
echo Verify:
echo   schtasks /Query /TN "%T_LOGON%" /V /FO LIST
echo   schtasks /Query /TN "%T_MIN%" /V /FO LIST
echo.
echo To configure: taskschd.msc → Find tasks → Properties → Conditions tab
echo To remove: tools\UNINSTALL_GUARD_TICK.cmd
echo.

pause

