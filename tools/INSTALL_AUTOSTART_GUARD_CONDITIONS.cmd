@echo off
setlocal

set "TASK=Spark-Guard-WebNext"

echo [configure] Configuring Task Scheduler Conditions for: %TASK%
echo.
echo This script will configure the task via XML (schtasks /Change does not support all options)
echo.
echo Manual configuration is recommended:
echo.
echo 1. Open Task Scheduler: taskschd.msc
echo 2. Find task: %TASK%
echo 3. Right-click → Properties
echo.
echo CONDITIONS tab - Uncheck ALL:
echo   ☐ Start the task only if the computer is on AC power
echo   ☐ Stop if the computer switches to battery power
echo   ☐ Start only if the following network connection is available
echo   ☐ Wake the computer to run this task
echo.
echo SETTINGS tab:
echo   ✅ If the task fails, restart every: 1 minute
echo   ✅ Attempt to restart up to: 10 times
echo   ☐ Stop the task if it runs longer than: ... (UNCHECK)
echo   ✅ If the running task does not end when requested, force it to stop
echo.
echo GENERAL tab (recommended):
echo   ✅ Run whether user is logged on or not
echo   ✅ Run with highest privileges
echo.
echo After configuration, verify:
echo   schtasks /Query /TN "%TASK%" /V /FO LIST
echo.
pause

