$ErrorActionPreference = 'Stop'
$root = 'C:\dev\CursorGPT_IDE'
$webRel = 'apps\web-next'
$port = 3003
$hostname = '127.0.0.1'
$baseUrl = 'http://{0}:{1}' -f $hostname, $port
$logDir = Join-Path $root '.runlogs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$serverOut = Join-Path $logDir ('web-next_server_{0}.out.log' -f (Get-Date -Format yyyyMMdd_HHmmss))
$serverErr = Join-Path $logDir ('web-next_server_{0}.err.log' -f (Get-Date -Format yyyyMMdd_HHmmss))

Write-Host '1) Port check...'
$tcp = try { Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop } catch { $null }
$tcpState = if ($tcp) { 'LISTEN' } else { 'NONE' }
$tnc = Test-NetConnection -ComputerName $hostname -Port $port
Write-Host ("Port state before start: {0}, TNC TcpTestSucceeded={1}" -f $tcpState, $tnc.TcpTestSucceeded)

Write-Host '2) Build web-next (workspace aware)...'
Set-Location $root
pnpm -w --filter web-next build

Write-Host '3) Start server auto (standalone preferred)...'
$standaloneServer = Join-Path $root 'apps\web-next\.next\standalone\apps\web-next\server.js'
$serverProc = $null
if (Test-Path $standaloneServer) {
  $wd = Split-Path $standaloneServer -Parent
  $env:PORT = "$port"
  $env:HOSTNAME = $hostname
  $serverProc = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $wd -PassThru -WindowStyle Hidden -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr
  $mode = 'standalone'
} else {
  $wd = Join-Path $root $webRel
  $serverProc = Start-Process -FilePath 'pnpm' -ArgumentList ('start -- -p {0} -H {1}' -f $port, $hostname) -WorkingDirectory $wd -PassThru -WindowStyle Hidden -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr
  $mode = 'next start'
}
Write-Host ("Mode: {0}, PID: {1}" -f $mode, ($serverProc.Id))

Write-Host '4) Wait for HTTP readiness (max 60s)...'
$ready = $false
for ($i=0; $i -lt 60; $i++) {
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 $baseUrl
    if ($resp.StatusCode -in 200,201,202,204,301,302,400,401,402,403) { $ready = $true; break }
  } catch {}
  Start-Sleep -Seconds 1
}
$httpCode = $null
if ($ready) {
  $httpCode = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $baseUrl).StatusCode
}
Write-Host ("Ready: {0} HTTP: {1}" -f $ready, $httpCode)

if (-not $ready) {
  Write-Host 'Server not ready; printing logs tail:'
  if (Test-Path $serverOut) { Get-Content $serverOut -Tail 120 }
  if (Test-Path $serverErr) { Get-Content $serverErr -Tail 120 }
  try { if ($serverProc -and !$serverProc.HasExited) { Stop-Process -Id $serverProc.Id -ErrorAction SilentlyContinue } } catch {}
  Write-Output '=== FINAL SUMMARY START ==='
  Write-Output ('Title: Web UI on :{0} smoke' -f $port)
  Write-Output 'Status: FAILURE'
  Write-Output ('BaseURL: {0}' -f $baseUrl)
  Write-Output 'HTTP Status: N/A'
  Write-Output 'Port evidence (before and after start):'
  try { Get-NetTCPConnection -LocalPort $port -State Listen | Format-List | Out-String } catch {}
  Write-Output ('Stdout log: {0}' -f $serverOut)
  Write-Output ('Stderr log: {0}' -f $serverErr)
  Write-Output '=== FINAL SUMMARY END ==='
  exit 1
}

Write-Host '5) Run Playwright smoke...'
Set-Location $root
$env:BASE_URL = $baseUrl
$testExit = 0
try { pnpm --filter web-next test:e2e:smoke } catch { $testExit = $LASTEXITCODE; if ($testExit -eq 0) { $testExit = 1 } }

Write-Host '6) Stop server and summarize...'
try { if ($serverProc -and !$serverProc.HasExited) { Stop-Process -Id $serverProc.Id -ErrorAction SilentlyContinue } } catch {}
$tcpInfo = try { (Get-NetTCPConnection -LocalPort $port -State Listen | Select-Object -First 1 | Format-List | Out-String) } catch { '' }
$stdoutTail = if (Test-Path $serverOut) { Get-Content $serverOut -Tail 120 | Out-String } else { '' }
$stderrTail = if (Test-Path $serverErr) { Get-Content $serverErr -Tail 120 | Out-String } else { '' }

Write-Output '=== FINAL SUMMARY START ==='
Write-Output ('Title: Web UI on :{0} smoke' -f $port)
Write-Output ('Status: {0}' -f ($(if ($testExit -eq 0) { 'SUCCESS' } else { 'FAILURE' })))
Write-Output ('BaseURL: {0}' -f $baseUrl)
Write-Output ('HTTP Status: {0}' -f $httpCode)
Write-Output 'Port evidence:'
Write-Output ($tcpInfo.Trim())
Write-Output 'Server stdout tail:'
Write-Output ($stdoutTail.Trim())
Write-Output 'Server stderr tail:'
Write-Output ($stderrTail.Trim())
Write-Output ('Smoke exit code: {0}' -f $testExit)
Write-Output ('Stdout log: {0}' -f $serverOut)
Write-Output ('Stderr log: {0}' -f $serverErr)
Write-Output '=== FINAL SUMMARY END ==='
exit $testExit
