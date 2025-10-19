$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

if (Test-Path "C:\dev\CursorGPT_IDE") { Set-Location "C:\dev\CursorGPT_IDE" } elseif (Test-Path "C:\dev") { Set-Location "C:\dev" } else { Set-Location "C:\" }

function Kill-Port([int]$p){
  try{ $pid=(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess) }catch{$pid=$null}
  if(-not $pid){ try{ $pid=(& netstat -ano | Select-String ":$p\s" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1) }catch{$pid=$null} }
  if($pid){ Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }
}

$PS1 = "C:\dev\hardlock_probe_e2e.ps1"
$SUM = "C:\dev\HARDLOCK_SUMMARY.txt"

$Body = @'
$ErrorActionPreference="SilentlyContinue"; $ProgressPreference="SilentlyContinue"
function Kill-Port([int]$p){ try{$pid=(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select -First 1 -Expand OwningProcess)}catch{$pid=$null}; if(-not $pid){ try{$pid=(& netstat -ano | Select-String ":$p\s" | % { ($_ -split '\s+')[-1] } | Select -First 1)}catch{$pid=$null} }; if($pid){ Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 500 } }
function Wait200([string]$u,[int]$sec=45){ $d=(Get-Date).AddSeconds($sec); while((Get-Date)-lt $d){ try{ if((iwr -UseBasicParsing -TimeoutSec 5 $u).StatusCode -eq 200){ return $true } }catch{}; Start-Sleep -Milliseconds 400 }; return $false }
function B64U([string]$s){ $b=[Text.Encoding]::UTF8.GetBytes($s); $t=[Convert]::ToBase64String($b); $t=$t.TrimEnd('='); $t=$t.Replace('+','-').Replace('/','_'); return $t }

# 3004 AUTH/DEBUG start
Kill-Port 3004
$env:NEXT_PUBLIC_AUTH_ENABLED="1"; $env:AUTH_ENABLED="1"; $env:FORCE_GUARD="1"; $env:NEXT_PUBLIC_CSP_REPORT_ONLY="1"
Start-Process -FilePath "pnpm" -ArgumentList "--filter","web-next","start","--","--port","3004" | Out-Null
if(-not (Wait200 "http://localhost:3004/api/healthz?mode=ui" 45)){ $warn1="WARN: health(ui) not 200" }

# PROBE1: cookie yok → /strategies
try { $r1=iwr -UseBasicParsing -MaximumRedirection 0 "http://localhost:3004/strategies" -ErrorAction Stop } catch { $r1=$_.Exception.Response }
$P1="PROBE1=/strategies code="+[int]$r1.StatusCode+" loc="+$r1.Headers['Location']+" guard="+$r1.Headers['x-ux-guard']+" path="+$r1.Headers['x-ux-path']+" token="+$r1.Headers['x-ux-token']

# PROBE2: user JWT → /strategies
$hdr='{"alg":"none","typ":"JWT"}'; $exp=[int]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()+3600); $pld='{"roles":["user"],"exp":'+$exp+'}'
$JWT=(B64U $hdr)+'.'+(B64U $pld)+'.'
$sess=New-Object Microsoft.PowerShell.Commands.WebRequestSession
$sess.Cookies.Add((New-Object System.Net.Cookie('spark_session',$JWT,'/','localhost')))
$sess.Cookies.Add((New-Object System.Net.Cookie('auth',$JWT,'/','localhost')))
$r2=iwr -UseBasicParsing "http://localhost:3004/strategies" -WebSession $sess -ErrorAction SilentlyContinue
$P2="PROBE2=/strategies code="+[int]$r2.StatusCode+" guard="+$r2.Headers['x-ux-guard']+" roles="+$r2.Headers['x-ux-roles']

# PROBE3: user JWT → /reports/verify
try { $r3=iwr -UseBasicParsing -MaximumRedirection 0 "http://localhost:3004/reports/verify" -WebSession $sess -ErrorAction Stop } catch { $r3=$_.Exception.Response }
$P3="PROBE3=/reports/verify code="+[int]$r3.StatusCode+" loc="+$r3.Headers['Location']+" guard="+$r3.Headers['x-ux-guard']+" roles="+$r3.Headers['x-ux-roles']

# E2E @3004
pnpm --filter web-next exec playwright install --with-deps | Out-Null
$PW = pnpm --filter web-next test:e2e

# 3005 CSP enforce
Kill-Port 3005
$env:NEXT_PUBLIC_CSP_REPORT_ONLY=""
pnpm --filter web-next build | Out-Null
Start-Process -FilePath "pnpm" -ArgumentList "--filter","web-next","start","--","--port","3005" | Out-Null
if(-not (Wait200 "http://localhost:3005/dashboard" 45)){ $warn2="WARN: dash not 200" }
$rE=iwr -UseBasicParsing "http://localhost:3005/strategies"
$CSP="CSP_ENFORCE csp="+[bool]$rE.Headers['content-security-policy']+" ro="+[bool]$rE.Headers['content-security-policy-report-only']+" dash="+(iwr -UseBasicParsing "http://localhost:3005/dashboard").StatusCode

# SUMMARY
$OK_E2E = ( ($PW -match " 0 failed") -or ( ($PW -match "passed") -and -not ($PW -match "failed") ) )
$OK_CSP = ($CSP -match "csp=True") -and ($CSP -match "ro=False") -and ($CSP -match "dash=200")
$STATUS = if ($OK_E2E -and $OK_CSP) { "GREEN" } else { "AMBER" }
$LINES = @(
  "STATUS="+$STATUS,
  "E2E_RESULT="+($PW -replace "`r","" -replace "`n"," "),
  $P1,
  $P2,
  $P3,
  $CSP
)
if($warn1){ $LINES += $warn1 }; if($warn2){ $LINES += $warn2 }
$LINES | Set-Content -Path "C:\dev\HARDLOCK_SUMMARY.txt" -Encoding UTF8 -Force
'@

Set-Content -Path $PS1 -Value $Body -Encoding UTF8 -Force

Kill-Port 3004; Kill-Port 3005

& powershell -NoProfile -ExecutionPolicy Bypass -File $PS1 | Out-Null

if (Test-Path $SUM) {
  Get-Content -Path $SUM -Raw
} else {
  "STATUS=AMBER`nERROR=Summary file not found at C:\dev\HARDLOCK_SUMMARY.txt"
}


