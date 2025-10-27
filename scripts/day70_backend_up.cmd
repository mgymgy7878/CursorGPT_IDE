@echo off
setlocal
echo [DAY-70] Backend Up (Windows)

if not defined PORT set PORT=4001
set NODE_ENV=development

echo Installing workspace deps...
pnpm i --prefer-offline

echo Building executor...
pnpm --filter @spark/executor build

echo Starting executor on %PORT% ...
node packages\executor\dist\index.js 