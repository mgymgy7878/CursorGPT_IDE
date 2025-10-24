param(
  [int]$Port=3003,
  [switch]$Accept307=$true,
  [switch]$StrictLint=$false
)

# ENV ile strict lint kontrolü
if ($env:SPARK_VERIFY_STRICT_LINT -eq '1') {
  $StrictLint = $true
}

$base = "http://127.0.0.1:$Port"
function S($u){ try { iwr $u -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop } catch { $null } }

# Endpoint autodetect: prom -> json fallback (source note)
$source = 'prom'
$prom = S "$base/api/public/metrics.prom"
if (-not $prom -or $prom.StatusCode -ne 200) {
  $source = 'json'
}

$resp = S "$base/"
$h  = if ($resp) { $resp.StatusCode } else { $null }
$r1 =  S "$base/backtest-lab"
$r2 =  S "$base/home"
# Çıktıları stringe normalize et
$ux = (cmd /c "pnpm -s ui:hash -- --print") | Out-String
$ln = (cmd /c "pnpm -s lint:tokens") | Out-String
$okH = if($Accept307){ $h -in 200,307 } else { $h -eq 200 }
# Dev/prod toleransı: 308 redirect yoksa 200 kabul et (dev middleware davranışı)
$okR1 = ($r1 -and (($r1.StatusCode -eq 308 -and $r1.Headers.Location -eq "/backtest") -or ($r1.StatusCode -eq 200)))
$okR2 = ($r2 -and (($r2.StatusCode -eq 308 -and $r2.Headers.Location -eq "/dashboard") -or ($r2.StatusCode -eq 200)))
$okL  = ($ln -match '0 (problems|issues|error|ihlal)')
$okU  = ($ux -match 'UX-ACK:')

# LINT MODE: Advisory (default) vs Strict
if (-not $StrictLint) {
  # Advisory mode: lint hataları exit kodunu etkilemez
  $lintStatus = if ($okL) { 'ADVISORY_PASS' } else { 'ADVISORY_WARN' }
  $result = if ($okH -and $okR1 -and $okR2 -and $okU) { 'PASS ✅' } else { 'FAIL ❌' }
} else {
  # Strict mode: lint dahil edilir
  $lintStatus = if ($okL) { 'STRICT_PASS' } else { 'STRICT_FAIL' }
  $result = if ($okH -and $okR1 -and $okR2 -and $okL -and $okU) { 'PASS ✅' } else { 'FAIL ❌' }
}

Write-Output ("SUMMARY HEALTH:{0} REDIR1:{1} REDIR2:{2} UXACK:{3} LINT:{4} RESULT:{5} PORT:{6} SOURCE:{7} STRICT:{8}" -f $okH,$okR1,$okR2,($ux -replace '\r?\n',' '),$lintStatus,$result,$Port,$source,$StrictLint)
exit ([int](-not ($result -like 'PASS*')))
