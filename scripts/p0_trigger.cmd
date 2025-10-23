@echo off
setlocal
set PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe
"%PS%" -NoExit -ExecutionPolicy Bypass -File "%~dp0p0_trigger.ps1"



