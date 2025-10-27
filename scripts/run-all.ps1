$ErrorActionPreference="Stop"
if(!(Test-Path ".logs")){ New-Item -ItemType Directory -Path .logs | Out-Null }

# 1) Çevre kurtarma
PowerShell -NoProfile -File scripts/env-rescue.ps1

# 2) PM2 + Observability
PowerShell -NoProfile -File scripts/dev-up.ps1

# 3) Health raporu
PowerShell -NoProfile -File scripts/doctor.ps1 | Out-File -FilePath .logs/doctor.json -Encoding utf8

# 4) Canary DRY-RUN
PowerShell -NoProfile -File scripts/canary-dryrun.ps1 -Symbol BTCTRY -TestDuration 45 | Out-File -FilePath .logs/canary-dryrun.json -Encoding utf8

Write-Host "DONE" -ForegroundColor Green
