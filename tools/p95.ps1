param([string]$WebBase="http://127.0.0.1:3005",[string]$Token="dev-xyz",[int]$N=20,[string]$Pair="BTCUSDT",[string]$Tf="15m",[string]$Style="breakout",[string]$Provider="mock")
$H = @{ Authorization="Bearer $Token"; "Content-Type"="application/json" }
$B = (@{ pair=$Pair; tf=$Tf; style=$Style; provider=$Provider } | ConvertTo-Json -Compress)
$T=@()
1..$N | ForEach-Object {
  $sw=[Diagnostics.Stopwatch]::StartNew();
  Invoke-RestMethod -Method Post -Uri "$WebBase/api/ai/strategies/generate" -Headers $H -Body $B | Out-Null;
  $sw.Stop();
  $T += $sw.ElapsedMilliseconds
}

# Drop first 3 warm-up samples if available to reduce cold-start skew
if ($T.Count -ge 4) {
  $S = $T[3..($T.Count-1)]
} else {
  $S = $T
}
$idx=[int][math]::Ceiling(0.95 * $S.Count)-1
$p95 = ($S | Sort-Object)[$idx]
"p95_ms=$p95  (n=$($T.Count), warm_dropped=$([Math]::Max(0,[int]($T.Count-($S.Count)))) )"
