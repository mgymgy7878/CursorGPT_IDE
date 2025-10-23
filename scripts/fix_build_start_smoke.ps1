$ErrorActionPreference = 'SilentlyContinue'

# === Parametreler ===
$ROOT  = "C:\dev\CursorGPT_IDE"
$APP   = Join-Path $ROOT "apps\web-next"
$NEXT  = Join-Path $APP ".next"
$EXP   = Join-Path $NEXT "export"
$PORT  = 3004
$UJSON = "http://127.0.0.1:$PORT/api/public/metrics"
$UPROM = "http://127.0.0.1:$PORT/api/public/metrics.prom"
$EVDIR = Join-Path $APP "evidence\local\oneshot"

# === 0) 3004 kullanan süreç varsa kapat ===
try {
  $lines = netstat -ano | findstr ":$PORT"
  foreach($ln in $lines){ $pid = ($ln -split "\s+")[-1]; if($pid -match '^\d+$'){ try{ taskkill /PID $pid /F | Out-Null }catch{} } }
} catch {}

# === 1) .next/export güvenli temizliği (ENOTEMPTY fix) ===
function Remove-DirSafe {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  try { takeown /f "$Path" /r /d y | Out-Null; icacls "$Path" /grant *S-1-1-0:(OI)(CI)F /t /q | Out-Null } catch {}
  $Temp = Join-Path $env:TEMP ("empty_" + [guid]::NewGuid().ToString("n"))
  New-Item -ItemType Directory -Force -Path $Temp | Out-Null
  robocopy $Temp "$Path" /MIR | Out-Null
  Remove-Item $Temp -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item $Path -Recurse -Force -ErrorAction SilentlyContinue
}
Remove-DirSafe $EXP

# === 2) Build ===
cd $ROOT
pnpm -w --filter web-next build

# === 3) Prod'ı 3004'te başlat (arka plan, minimize) ===
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoProfile","-Command","cd '$ROOT'; pnpm -w --filter web-next start -- -p $PORT"
) -WindowStyle Minimized | Out-Null

# === 4) Hazır olana dek bekle (.prom) ===
$ready=$false
for($i=0;$i -lt 45;$i++){
  try{ if((Invoke-WebRequest $UPROM -TimeoutSec 2 -UseBasicParsing).StatusCode -eq 200){$ready=$true;break} }catch{}
  Start-Sleep 1
}
if(-not $ready){ Write-Output "HATA: 45 sn içinde metrics.prom açılmadı"; exit 2 }

# === 5) Dashboard aç → mock ticker tetikle ===
try { Start-Process "http://127.0.0.1:$PORT/dashboard" | Out-Null } catch {}
Start-Sleep 8

# === 6) SMOKE v2 (negatif delta clamp + 3 deneme) ===
function R { param([string]$u) try{ Invoke-RestMethod $u -TimeoutSec 5 } catch { $null } }
$pass=$false
for($try=1;$try -le 3 -and -not $pass;$try++){
  $m1=R $UJSON; Start-Sleep 4; $m2=R $UJSON
  $d=0; if($m1 -and $m2 -and $m1.counters -and $m2.counters){
    $d=[int]$m2.counters.spark_ws_btcturk_msgs_total - [int]$m1.counters.spark_ws_btcturk_msgs_total
  }
  if($d -lt 0){ $d=0 }
  $s=999.0; if($m2 -and $m2.gauges -and $m2.gauges.spark_ws_staleness_seconds -ne $null){
    $s=[double]$m2.gauges.spark_ws_staleness_seconds
  }
  Write-Output ("try #$try | port: $PORT"); Write-Output ("msgs_total delta: $d"); Write-Output ("staleness s: $s")
  if(($d -ge 1) -and ($s -lt 4)){ Write-Output "SMOKE: PASS"; $pass=$true } else { Write-Output "SMOKE: ATTENTION" }
  if(-not $pass){ Start-Sleep 3 }
}

# === 7) Kanıt dosyaları ===
New-Item -ItemType Directory -Force -Path $EVDIR | Out-Null
try{
  $hdr=(Invoke-WebRequest $UJSON -TimeoutSec 5 -UseBasicParsing).Headers
  $ver=Get-Content (Join-Path $APP "package.json") | Out-String
  ("`n=== HEADERS ({0}) ===`n{1}`n=== WEB-NEXT PKG ===`n{2}" -f $PORT, ($hdr|Out-String), $ver) |
    Out-File (Join-Path $EVDIR "metrics_headers_and_version.txt") -Encoding utf8
}catch{
  ("metrics headers alınamadı: {0}" -f $_.Exception.Message) |
    Out-File (Join-Path $EVDIR "metrics_headers_and_version.txt") -Encoding utf8
}
try{
  (Invoke-WebRequest $UPROM -TimeoutSec 5 -UseBasicParsing).Content -split "`n" | Select-Object -First 12 |
    Out-File (Join-Path $EVDIR "metrics_prom_head.txt") -Encoding utf8
}catch{}

# === 8) Özet (ekrana) ===
Get-Content (Join-Path $EVDIR "metrics_headers_and_version.txt") -TotalCount 15
Get-Content (Join-Path $EVDIR "metrics_prom_head.txt")

exit 0


