@echo off
setlocal

echo [1/3] types tsc...
pushd packages\@spark\types >nul 2>&1
pnpm exec tsc -p tsconfig.build.json || (popd >nul & exit /b 1)
popd >nul

if exist packages\@spark\shared\tsconfig.json (
  echo [1b/3] shared tsc...
  pushd packages\@spark\shared >nul 2>&1
  pnpm exec tsc -p tsconfig.json || (popd >nul & exit /b 1)
  popd >nul
)

echo [2/3] executor...
start "executor-4001" cmd /c "pnpm -w -F executor dev"

echo [wait] giving executor time to boot...
timeout /t 3 >nul

echo [3/3] web...
start "web-3003" cmd /c "pnpm -w -F web-next dev -- -p 3003"

echo [OK] executor:4001 + web:3003. UI: http://127.0.0.1:3003/ops
endlocal
