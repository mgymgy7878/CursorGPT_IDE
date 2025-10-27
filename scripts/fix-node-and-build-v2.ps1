# scripts\fix-node-and-build.ps1  (v2 with MSI fallback)
$ErrorActionPreference = "Stop"
$ROOT = (Get-Location)
$EVID = Join-Path $ROOT "logs\evidence\node20_build\$(Get-Date -Format yyyyMMdd_HHmmss)"
New-Item -ItemType Directory -Force -Path $EVID | Out-Null

function Ensure-Node20 {
  try { $nv = (node -v) } catch { $nv = "" }
  if ($nv -like "v20.10*") { return }
  if (Get-Command nvm -ErrorAction SilentlyContinue) {
    Write-Host "NVM detected → installing 20.10.0 ..."
    nvm install 20.10.0
    nvm use 20.10.0
  } else {
    Write-Host "NVM not found → using MSI fallback ..."
    & "$ROOT\scripts\install-node20-msi.ps1"
  }
  node -v | Tee-Object "$EVID\node_version.txt"
}

Write-Host "== 0) Kill stray node processes ==" -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "== 1) Ensure Node 20.10.0 ==" -ForegroundColor Cyan
Ensure-Node20

Write-Host "== 2) pnpm & clean install ==" -ForegroundColor Cyan
npm i -g pnpm@10 | Tee-Object "$EVID\npm_pnpm_sync.log"
pnpm -v  | Tee-Object "$EVID\pnpm_version.txt"
pnpm store prune | Tee-Object "$EVID\pnpm_prune.log"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
pnpm -w install | Tee-Object "$EVID\pnpm_install.log"

Write-Host "== 3) Build chain ==" -ForegroundColor Cyan
pnpm --filter @spark/types run build        | Tee-Object "$EVID\build_types.log"
pnpm -w run build:core                      | Tee-Object "$EVID\build_core.log"
pnpm --filter web-next run build            | Tee-Object "$EVID\web_next_build.log"
pnpm --filter executor run build            | Tee-Object "$EVID\executor_build.log"

Write-Host "== 4) Start dev services ==" -ForegroundColor Cyan
Start-Process -WindowStyle Hidden -FilePath "pnpm" -ArgumentList "--filter web-next run dev"
Start-Process -WindowStyle Hidden -FilePath "pnpm" -ArgumentList "--filter executor run dev"
Start-Sleep -Seconds 6

Write-Host "== 5) Health & metrics ==" -ForegroundColor Cyan
try {
  (Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3003/api/public/health").Content | Out-File -Encoding UTF8 "$EVID\web_health.json"
} catch { "web_health_error=$($_.Exception.Message)" | Out-File "$EVID\web_health.json" }
try {
  (Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/health").Content | Out-File -Encoding UTF8 "$EVID\executor_health.json"
} catch { "executor_health_error=$($_.Exception.Message)" | Out-File "$EVID\executor_health.json" }
try {
  (Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3003/api/public/metrics/prom").Content | Out-File -Encoding UTF8 "$EVID\metrics.prom"
} catch { "metrics_error=$($_.Exception.Message)" | Out-File "$EVID\metrics.prom" }

if (Test-Path "$ROOT\apps\web-next\.next\BUILD_ID") {
  Get-Content "$ROOT\apps\web-next\.next\BUILD_ID" | Out-File "$EVID\web_next_BUILD_ID.txt"
}
(Get-ChildItem -Recurse -Filter package.json | Select-Object -Expand FullName) | Out-File "$EVID\package_json_list.txt"

Write-Host "`n✅ DONE. Evidence: $EVID" -ForegroundColor Green
