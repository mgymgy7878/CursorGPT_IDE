@echo off
setlocal
>scripts\git-safe.cmd echo @echo off
>>scripts\git-safe.cmd echo rem Read-only git wrapper
>>scripts\git-safe.cmd echo set CMD=%%1
>>scripts\git-safe.cmd echo if "%%CMD%%"=="status"     (git status ^& exit /b %%errorlevel%%)
>>scripts\git-safe.cmd echo if "%%CMD%%"=="diff"       (shift ^& git diff %%* ^& exit /b %%errorlevel%%)
>>scripts\git-safe.cmd echo if "%%CMD%%"=="log"        (shift ^& git log --oneline --decorate --max-count=50 %%* ^& exit /b %%errorlevel%%)
>>scripts\git-safe.cmd echo if "%%CMD%%"=="show"       (shift ^& git show %%* ^& exit /b %%errorlevel%%)
>>scripts\git-safe.cmd echo if "%%CMD%%"=="rev-parse"  (shift ^& git rev-parse %%* ^& exit /b %%errorlevel%%)
>>scripts\git-safe.cmd echo if "%%CMD%%"=="branch"     (shift ^& git branch %%* ^& exit /b %%errorlevel%%)
>>scripts\git-safe.cmd echo echo [git-safe] BLOCKED
>scripts\pm2-safe.cmd echo @echo off
>>scripts\pm2-safe.cmd echo rem Read-only pm2 wrapper
>>scripts\pm2-safe.cmd echo set CMD=%%1
>>scripts\pm2-safe.cmd echo if "%%CMD%%"=="ls"        (pm2 ls ^& exit /b %%errorlevel%%)
>>scripts\pm2-safe.cmd echo if "%%CMD%%"=="list"      (pm2 list ^& exit /b %%errorlevel%%)
>>scripts\pm2-safe.cmd echo if "%%CMD%%"=="monit"     (pm2 monit ^& exit /b %%errorlevel%%)
>>scripts\pm2-safe.cmd echo if "%%CMD%%"=="describe"  (shift ^& pm2 describe %%* ^& exit /b %%errorlevel%%)
>>scripts\pm2-safe.cmd echo echo [pm2-safe] BLOCKED
echo Wrappers refreshed (ASCII/CRLF).
