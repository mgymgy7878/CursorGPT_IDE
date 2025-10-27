@echo off
rem Read-only git wrapper
set CMD=%1
if "%CMD%"=="status"     (git status & exit /b %errorlevel%)
if "%CMD%"=="diff"       (shift & git diff %* & exit /b %errorlevel%)
if "%CMD%"=="log"        (shift & git log --oneline --decorate --max-count=50 %* & exit /b %errorlevel%)
if "%CMD%"=="show"       (shift & git show %* & exit /b %errorlevel%)
if "%CMD%"=="rev-parse"  (shift & git rev-parse %* & exit /b %errorlevel%)
if "%CMD%"=="branch"     (shift & git branch %* & exit /b %errorlevel%)
echo [git-safe] BLOCKED
