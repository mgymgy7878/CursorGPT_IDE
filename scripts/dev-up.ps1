$ErrorActionPreference="Stop"
Write-Host "▶ DEV-UP" -ForegroundColor Cyan

if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) { pnpm dlx pm2@latest install | Out-Null }
if (Test-Path "ecosystem.config.js") {
  pm2 start ecosystem.config.js --update-env
  pm2 save
} else { Write-Host "⚠ ecosystem.config.js yok (PM2 adımı atlandı)" -ForegroundColor DarkYellow }

$composeCandidates = @("docker-compose.observability.yml","ops/docker-compose.observability.yml")
$used = $null
foreach($f in $composeCandidates){ if(Test-Path $f){ docker compose -f $f up -d; $used=$f; break } }
if(-not $used){ Write-Host "ℹ Observability compose dosyası bulunamadı" }

Write-Host "✓ DEV-UP tamam" -ForegroundColor Green