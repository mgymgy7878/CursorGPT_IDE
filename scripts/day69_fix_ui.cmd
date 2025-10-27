@echo off
setlocal enabledelayedexpansion
echo [DAY-69] Spark UI Port Fix (Windows)

where pnpm >NUL 2>&1 || (echo pnpm bulunamadi. Node.js/pnpm yuklu mu? & exit /b 1)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3003 ^| findstr LISTENING') do (
  echo Port 3003 PID: %%p bulundu, kapatiliyor...
  taskkill /F /PID %%p >NUL 2>&1
)

git clean -xfd -e ".env*" 
pnpm dlx rimraf node_modules
pnpm -w store prune

pnpm add -Dw typescript @types/node @types/react @types/react-dom
pnpm i --prefer-offline

pnpm fix:imports && pnpm scan:exports && pnpm lint:imports && pnpm guard:imports
pnpm -w exec tsc -v
pnpm typecheck || echo "typecheck bitti"

pnpm -w exec next --version

echo UI 3003 portunda baslatiliyor...
pnpm --filter apps/web-next dev -p 3003 || (
  echo 3003 portu kullanilamiyor! 3033 portunda tekrar deneniyor...
  pnpm --filter apps/web-next dev -p 3033
) 