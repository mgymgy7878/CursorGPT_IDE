$ErrorActionPreference = 'Stop'

# 0) Temizlik + port testi
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$port = 3003
Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Out-Null
$tnc = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue
Write-Host ("TCP test before start: {0}" -f $tnc.TcpTestSucceeded)

# 1) Build
Set-Location apps\web-next
pnpm build

# 2) Sunucu (Next CLI ile) — log ve PID tut; standalone'ı atla
$standaloneA = ".next\standalone\server.js"
$standaloneB = ".next\standalone\apps\web-next\server.js"
$logDir = Join-Path $PSScriptRoot "..\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$svOut = Join-Path $logDir "web3003_server.out.log"
$svErr = Join-Path $logDir "web3003_server.err.log"

$p = Start-Process -FilePath 'node' -ArgumentList @('node_modules/next/dist/bin/next','start','-p','3003','-H','127.0.0.1') -RedirectStandardOutput $svOut -RedirectStandardError $svErr -PassThru -WindowStyle Hidden -WorkingDirectory (Get-Location)
$mode = 'next-start'
"SERVER_PID=$($p.Id) MODE=$mode" | Tee-Object -FilePath (Join-Path $logDir "web3003_server.pid") | Out-Host

# 3) Hazır olana kadar bekle (maks 60 sn)
function Wait-Ready([int]$sec){
  $urls = @("http://127.0.0.1:3003","http://localhost:3003")
  $res = @{ ok=$false; code=$null; url=$null }
  1..$sec | ForEach-Object {
    foreach($cand in $urls){
      try {
        $r = Invoke-WebRequest -UseBasicParsing $cand -TimeoutSec 2
        if ($r.StatusCode -in 200,201,202,204,301,302,400,401,402,403) { $res.ok = $true; $res.code = $r.StatusCode; $res.url = $cand; break }
      } catch { }
    }
    if ($res.ok) { break } else { Start-Sleep 1 }
  }
  return $res
}

$probe = Wait-Ready 60
if (-not $probe.ok) { Write-Host "Server not ready on :3003"; if (Test-Path $svOut) { Get-Content -Tail 50 $svOut | Out-Host }; if (Test-Path $svErr) { Get-Content -Tail 50 $svErr | Out-Host }; exit 1 }
"READY: $($probe.url) -> HTTP $($probe.code) MODE=$mode" | Tee-Object -FilePath (Join-Path $logDir "web3003_ready.txt") | Out-Host
${u} = $probe.url
${code} = $probe.code

# 4) Smoke E2E
Set-Location ..\..
$env:BASE_URL = $u
pnpm --filter web-next test:e2e:smoke
$smokeExit = $LASTEXITCODE

# 5) Ek kanıtlar
$listen = try { Get-NetTCPConnection -LocalPort 3003 -State Listen | Format-Table -AutoSize | Out-String } catch { '' }
$tailOut = if (Test-Path $svOut) { (Get-Content -Tail 50 $svOut) -join "`n" } else { '' }
$tailErr = if (Test-Path $svErr) { (Get-Content -Tail 50 $svErr) -join "`n" } else { '' }

# 6) FINAL SUMMARY yazdır
Write-Output ("FINAL SUMMARY | LOCAL-SMOKE-3003 | MODE {0} | HTTP {1} | PID {2} | SMOKE_EXIT {3}" -f $mode, $code, $p.Id, $smokeExit)
Write-Output "--- PORT LISTEN ---"
Write-Output $listen
Write-Output "--- SERVER STDOUT TAIL ---"
Write-Output $tailOut
Write-Output "--- SERVER STDERR TAIL ---"
Write-Output $tailErr
exit $smokeExit


