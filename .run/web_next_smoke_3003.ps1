$ErrorActionPreference='''Stop'''
$root='C:\dev\CursorGPT_IDE'
$web='apps\web-next'
$port=3003
$host='127.0.0.1'
$logDir=Join-Path $root '.runlogs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$serverLog=Join-Path $logDir ('web-next_server_{0}.log' -f (Get-Date -Format yyyyMMdd_HHmmss))

Write-Host '1) Cleaning node processes and checking port...'
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$portInUse=$false
try { Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop | Out-Null; $portInUse=$true } catch {}
if ($portInUse) { Write-Host "Port $port is in use. Aborting."; exit 2 }

Write-Host '2) Building apps/web-next...'
Set-Location (Join-Path $root $web)
pnpm install --frozen-lockfile
pnpm build

$standalone=Test-Path '.next\standalone\server.js'
Write-Host ('3) Starting server (mode: {0})...' -f ($(if($standalone){'standalone'} else {'next start'})))
$env:HOSTNAME=$host
$env:PORT="{0}" -f $port
if ($standalone) { $startCmd = 'node .\\.next\\standalone\\server.js' } else { $startCmd = ('pnpm start -- -p {0} -H {1}' -f $port, $host) }

Start-Job -Name webnext -ScriptBlock {
  param($cmd, $wd, $log)
  Set-Location $wd
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'powershell.exe'
  $psi.Arguments = ('-NoProfile -ExecutionPolicy Bypass -Command `$ErrorActionPreference="Stop"; {0}' -f $cmd)
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()
  $out = $p.StandardOutput
  $err = $p.StandardError
  while (-not $p.HasExited) {
    if (-not $out.EndOfStream) { Add-Content -Path $log -Value ($out.ReadLine()) }
    if (-not $err.EndOfStream) { Add-Content -Path $log -Value ($err.ReadLine()) }
    Start-Sleep -Milliseconds 100
  }
} -ArgumentList $startCmd, (Get-Location).Path, $serverLog | Out-Null

Write-Host '4) Waiting for HTTP readiness...'
$baseUrl = 'http://{0}:{1}' -f $host, $port
$ok=$false
for($i=0;$i -lt 60;$i++){
  try {
    $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 $baseUrl
    if($r.StatusCode -in 200,201,202,204,301,302,400,401,402,403){ $ok=$true; break }
  } catch {}
  Start-Sleep -Seconds 1
}
if(-not $ok){ Write-Host 'Server did not become ready in time.'; Receive-Job -Name webnext -ErrorAction SilentlyContinue | Out-Null; Stop-Job -Name webnext -Force -ErrorAction SilentlyContinue; exit 3 }
$sc=(Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $baseUrl).StatusCode

Write-Host '5) Running Playwright smoke E2E...'
Set-Location $root
$env:BASE_URL=$baseUrl
$testExit=0
try { pnpm --filter web-next test:e2e:smoke } catch { $testExit=$LASTEXITCODE; if($testExit -eq 0){ $testExit=1 } }

$tcpInfo = try { (Get-NetTCPConnection -LocalPort $port -State Listen | Select-Object -First 1 | Format-List | Out-String) } catch { '' }
$tail = if (Test-Path $serverLog) { Get-Content $serverLog -Tail 50 | Out-String } else { '' }

Write-Host '6) Stopping server job and printing FINAL SUMMARY...'
Stop-Job -Name webnext -Force -ErrorAction SilentlyContinue
Receive-Job -Name webnext -ErrorAction SilentlyContinue | Out-Null
Remove-Job -Name webnext -ErrorAction SilentlyContinue

Write-Output '=== FINAL SUMMARY START ==='
Write-Output ('Title: Web UI on :{0} smoke' -f $port)
Write-Output ('Status: {0}' -f ($(if ($ok -and $testExit -eq 0) { 'SUCCESS' } else { 'FAILURE' })))
Write-Output ('BaseURL: {0}' -f $baseUrl)
Write-Output ('HTTP Status: {0}' -f $sc)
Write-Output 'Port evidence:'
Write-Output ($tcpInfo.Trim())
Write-Output 'Server log tail:'
Write-Output ($tail.Trim())
Write-Output ('Smoke exit code: {0}' -f $testExit)
Write-Output ('Log file: {0}' -f $serverLog)
Write-Output '=== FINAL SUMMARY END ==='
exit $testExit
