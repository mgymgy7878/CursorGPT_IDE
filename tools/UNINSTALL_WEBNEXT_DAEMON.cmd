@echo off
setlocal
set "TASK=Spark-WebNext-Daemon"
echo [uninstall] Deleting Task: %TASK%
schtasks /Delete /TN "%TASK%" /F
echo [uninstall] DONE.
pause
exit /b 0
