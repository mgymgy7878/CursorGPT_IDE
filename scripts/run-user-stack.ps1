$ErrorActionPreference="Stop"
if(!(Test-Path ".logs")){ New-Item -ItemType Directory -Path .logs | Out-Null }

# 1) User-level Node + pnpm (admin yok)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/user-node-bootstrap.ps1

# 2) PM2 + Observability (ops varsa)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev-up.ps1

# 3) Health raporu
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/doctor.ps1 | Out-File -FilePath .logs/doctor.json -Encoding utf8

# 4) Canary DRY-RUN
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/canary-dryrun.ps1 -Symbol BTCTRY -TestDuration 45 | Out-File -FilePath .logs/canary-dryrun.json -Encoding utf8

Write-Host "DONE" -ForegroundColor Green
