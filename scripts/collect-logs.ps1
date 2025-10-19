param([string]$OutDir)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# UI dev job log (varsa)
Write-Host ">> UI dev log (job)"
try { Receive-Job -Name spark-web-next -Keep | Out-File -Encoding utf8 (Join-Path $OutDir "ui_dev_job.log") } catch {}

# Next.js .next logs (varsa)
Get-ChildItem -Recurse -ErrorAction SilentlyContinue "$root\apps\web-next\.next" `
  | Out-File -Encoding utf8 (Join-Path $OutDir "next_tree.txt")

# Executor logs (PM2 yoksa best-effort)
Get-Process -Name "node" -ErrorAction SilentlyContinue | Out-File -Encoding utf8 (Join-Path $OutDir "process_node.txt")

# Docker compose varsa container logları (best-effort)
Write-Host ">> docker logs (best-effort)"
docker compose ps | Out-File -Encoding utf8 (Join-Path $OutDir "docker_ps.txt") 2>$null
docker compose logs --no-color > (Join-Path $OutDir "docker_logs.txt") 2>$null

# HTTP kanıtları listesi
Get-ChildItem $OutDir | Select-Object Name,Length,LastWriteTime `
  | Out-File -Encoding utf8 (Join-Path $OutDir "INDEX.txt")


