# ================== Spark DEV Start (Windows) ==================
$ErrorActionPreference = "Stop"
cd C:\dev\CursorGPT_IDE\CursorGPT_IDE

# 0) Port temizliği
$ports = @(3003,4001)
foreach ($p in $ports) {
  $pids = (Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -Expand OwningProcess -Unique)
  foreach ($pid in $pids) { try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {} }
}

# 1) Bağımlılıklar (gerekliyse)
if (-not (Test-Path ".\node_modules")) { pnpm -w install }

# 2) Ortam
$env:NODE_OPTIONS="--max-old-space-size=4096"
$env:NEXT_PUBLIC_ADMIN_ENABLED="true"
$env:HOST="127.0.0.1"
$env:PORT="3003"
$env:ADMIN_TOKEN="test-secret-123"

# 3) Log klasörü
$logDir = ".\evidence\devlogs"; if (-not (Test-Path $logDir)) { New-Item -ItemType Directory $logDir | Out-Null }

# 4) Executor (4001)
$execCmd = 'pnpm --filter @spark/executor dev'
Start-Job -Name "spark-exec" -ScriptBlock {
  param($cmd,$dir,$log)
  Set-Location $dir
  Invoke-Expression $cmd 2>&1 | Tee-Object -FilePath $log -Append
} -ArgumentList $execCmd,(Get-Location).Path,("$logDir\executor.log") | Out-Null

# 5) Web-Next (3003) — hostname/port pinli
$webCmd = 'pnpm --filter @spark/web-next dev --port 3003 --hostname 127.0.0.1'
Start-Job -Name "spark-web" -ScriptBlock {
  param($cmd,$dir,$log)
  Set-Location $dir
  Invoke-Expression $cmd 2>&1 | Tee-Object -FilePath $log -Append
} -ArgumentList $webCmd,(Get-Location).Path,("$logDir\web-next.log") | Out-Null

# 6) Warmup bekleme ve sağlık kontrolü
Start-Sleep -Seconds 10
.\health-dev.ps1

Write-Host "`n>> Logs: $logDir\executor.log  |  $logDir\web-next.log"
Write-Host ">> UI: http://127.0.0.1:3003  ,  Executor: http://127.0.0.1:4001"
# ==============================================================