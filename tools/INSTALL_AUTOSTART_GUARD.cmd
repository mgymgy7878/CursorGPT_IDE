@echo off
setlocal

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "TASK=Spark-Guard-WebNext"
set "SCRIPT=%ROOT%\tools\SPARK_GUARD_WEBNEXT.cmd"

echo [install] Installing autostart guard task: %TASK%
echo [install] Guard script: %SCRIPT%
echo.

rem "At startup" trigger (logon yerine - daha stabil, kullanıcı girişi beklemez)
echo [install] Creating task with "At startup" trigger (30s delay)...
schtasks /Create /F ^
 /TN "%TASK%" ^
 /SC ONSTART ^
 /DELAY 0000:30 ^
 /RL LIMITED ^
 /TR "cmd.exe /d /s /c \"\"%SCRIPT%\""

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to create task. Error code: %ERRORLEVEL%
    echo [info] Try running as Administrator
    pause
    exit /b 1
)

echo [OK] Task created successfully: %TASK%
echo.
echo [IMPORTANT] Task Scheduler Conditions ayarları:
echo   Task Scheduler'dan task'ı açıp şu ayarları YAPIN:
echo.
echo   Conditions tab:
echo     ☐ "Start the task only if the computer is on AC power" → KAPAT
echo     ☐ "Stop if the computer switches to battery power" → KAPAT
echo     ☐ "Start only if the following network connection is available" → KAPAT
echo.
echo   Settings tab:
echo     ✅ "If the task fails, restart every: 1 minute" (10 attempts)
echo     ☐ "Stop the task if it runs longer than: ..." → KAPAT
echo.
echo   General tab:
echo     ✅ "Run whether user is logged on or not" (recommended)
echo     ✅ "Run with highest privileges" (if needed for port access)
echo.
echo [info] Task will run 30 seconds after Windows startup
echo [info] Guard checks port 3003 every 5 seconds and starts web-next if down
echo [info] Web-next is started in Hidden window (Task Scheduler-safe)
echo.
echo To verify: schtasks /Query /TN "%TASK%" /V /FO LIST
echo To remove: schtasks /Delete /TN "%TASK%" /F
echo.
echo To configure conditions: taskschd.msc → %TASK% → Properties → Conditions tab
echo Or run: tools\INSTALL_AUTOSTART_GUARD_CONDITIONS.cmd for detailed guide
echo.

pause
