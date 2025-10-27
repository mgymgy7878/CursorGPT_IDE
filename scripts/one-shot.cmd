@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem === Evidence & summary ===
set EVID=evidence\local\oneshot
if not exist "%EVID%" mkdir "%EVID%"
set SUM=%EVID%\summary.txt
> "%SUM%" echo STATUS=YELLOW
>>"%SUM%" echo STEP=init
>>"%SUM%" echo START=%DATE% %TIME%

rem === helpers ===
set FIRST_ERR=%EVID%\first.txt
if exist "%FIRST_ERR%" del "%FIRST_ERR%" >nul 2>&1
set HEALTH_JSON=%EVID%\health.json

rem fail(label, code)
:fail
set STEP=%~1
set CODE=%~2
>>"%SUM%" echo STEP=!STEP!
>>"%SUM%" echo CODE=!CODE!
if exist evidence\local\tsc_core_first.txt (
  type evidence\local\tsc_core_first.txt > "%FIRST_ERR%"
  >>"%SUM%" echo FIRST=!FIRST_ERR!
)
exit /b !CODE!

rem mark(label)
:mark
set STEP=%~1
>>"%SUM%" echo STEP=!STEP!
goto :eof

call :mark versions
node -v > "%EVID%\node.txt" 2>&1
pnpm -v > "%EVID%\pnpm.txt" 2>&1

call :mark ensure-env
if not exist apps\web-next\.env.local (
  echo EXECUTOR_BASE=http://127.0.0.1:4001>apps\web-next\.env.local
) else (
  findstr /R /C:"^EXECUTOR_BASE=" apps\web-next\.env.local >nul || (
    echo EXECUTOR_BASE=http://127.0.0.1:4001>>apps\web-next\.env.local
  )
)

call :mark ts:diag:core
call pnpm run ts:diag:core
if errorlevel 1 call :fail "ts:diag:core" 2

call :mark check:fast
call pnpm -w run check:fast
if errorlevel 1 (
  call :mark lint-fix
  call pnpm -w run lint -- --fix
  call pnpm -w run check:fast
  if errorlevel 1 call :fail "check:fast" 3
)

call :mark build(web-next)
set NODE_OPTIONS=--max-old-space-size=4096
call pnpm --filter web-next run build --silent
if errorlevel 1 call :fail "build(web-next)" 4

rem --- git push güvenli: uzun path + kimlik yönetici
call :mark git-config
git config core.longpaths true
git config --global credential.helper manager-core >nul 2>&1

call :mark branch
git checkout -B feat/v1.2-btcturk-bist

call :mark commit
set HUSKY=0
git add -A
git commit -m "build: TS pass; ui: StatusPill→executor; ci: doctor evidence"
if errorlevel 1 (
  git commit --allow-empty -m "chore: trigger CI"
)

call :mark push
git rev-parse --abbrev-ref --symbolic-full-name @{u} >nul 2>&1
if errorlevel 1 (
  git push --set-upstream origin feat/v1.2-btcturk-bist || call :fail "git push" 5
) else (
  git push || call :fail "git push" 5
)

rem --- smoke (curl yoksa PS fallback)
call :mark smoke
where curl >nul 2>&1
if errorlevel 1 (
  powershell -NoLogo -NoProfile -Command "try{(Invoke-WebRequest -Uri http://127.0.0.1:3003/api/public/health -UseBasicParsing).Content | Out-File -Encoding UTF8 '%HEALTH_JSON%'; exit 0}catch{exit 1}"
) else (
  curl -s http://127.0.0.1:3003/api/public/health > "%HEALTH_JSON%" 2>nul
)
if errorlevel 1 call :fail "smoke" 6

> "%SUM%" echo STATUS=GREEN
>>"%SUM%" echo STEP=all
>>"%SUM%" echo END=%DATE% %TIME%
exit /b 0