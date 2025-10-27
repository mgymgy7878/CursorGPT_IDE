Param([switch]$CI)
$ErrorActionPreference = "Stop"
Write-Host "▶ BOOTSTRAP" -ForegroundColor Cyan

function Ensure-Cmd($name, $check, $wingetId) {
  if (-not (Get-Command $check -ErrorAction SilentlyContinue)) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
      Write-Host "• Installing $name via winget..." -ForegroundColor Yellow
      winget install -e --id $wingetId --accept-package-agreements --accept-source-agreements | Out-Null
    } else {
      Write-Host "⚠ winget yok, $name için manuel kurulum gerekebilir." -ForegroundColor DarkYellow
    }
  } else { Write-Host "✓ $name mevcut" -ForegroundColor Green }
}

Ensure-Cmd "Node LTS" "node" "OpenJS.NodeJS.LTS"
if (Get-Command node -ErrorAction SilentlyContinue) {
  node -v
  corepack enable | Out-Null
  corepack prepare pnpm@10.14.0 --activate | Out-Null
  pnpm -v
}

$env:NODE_OPTIONS="--max-old-space-size=4096"
Write-Host "• pnpm -w install"
pnpm -w install

function Ensure-Env($p){ if(-not (Test-Path $p)){ New-Item -ItemType File -Path $p -Force | Out-Null } }
Ensure-Env ".env"
Ensure-Env "apps/web-next/.env.local"
Ensure-Env "services/executor/.env"

Write-Host "• pnpm -w build"
pnpm -w build
Write-Host "✓ BOOTSTRAP tamam" -ForegroundColor Green