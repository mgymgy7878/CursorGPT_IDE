param([int]$Port=3003,[switch]$Accept307=$true)
$base = "http://127.0.0.1:$Port"
function S($u){ try { iwr $u -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop } catch { $null } }
$resp = S "$base/"
$h  = if ($resp) { $resp.StatusCode } else { $null }
$r1 =  S "$base/backtest-lab"
$r2 =  S "$base/home"
$ux = cmd /c "pnpm -s ui:hash -- --print"
$ln = cmd /c "pnpm -s lint:tokens"
$okH = if($Accept307){ $h -in 200,307 } else { $h -eq 200 }
$okR1 = ($r1 -and $r1.StatusCode -eq 308 -and $r1.Headers.Location -eq "/backtest")
$okR2 = ($r2 -and $r2.StatusCode -eq 308 -and $r2.Headers.Location -eq "/dashboard")
$okL  = ($ln -match '0 (problems|issues|error|ihlal)')
$okU  = ($ux -match 'UX-ACK:')
$result = if ($okH -and $okR1 -and $okR2 -and $okL -and $okU) { 'PASS ✅' } else { 'FAIL ❌' }
Write-Output ("SUMMARY HEALTH:{0} REDIR1:{1} REDIR2:{2} UXACK:{3} LintOK:{4} RESULT:{5} PORT:{6}" -f $okH,$okR1,$okR2,($ux -replace '\r?\n',' '),$okL,$result,$Port)
exit ([int](-not ($result -like 'PASS*')))
