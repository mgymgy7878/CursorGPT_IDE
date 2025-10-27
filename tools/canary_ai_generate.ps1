Param(
  [string]$Base = "http://127.0.0.1:3005",
  [string]$Auth = "dev-xyz",
  [string]$Pair = "BTCUSDT",
  [string]$Tf = "15m",
  [string]$Style = "trend",
  [int]$N = 7
)
$Headers = @{ "Authorization" = "Bearer $Auth"; "Content-Type" = "application/json" }
Write-Host "[*] AI generate canary ($N x)…" -ForegroundColor Cyan
$ok=0; $fail=0; $dur=@()
for ($i=1; $i -le $N; $i++) {
  $Body = @{ pair=$Pair; tf=$Tf; style=$Style; provider="mock" } | ConvertTo-Json -Compress
  $sw=[System.Diagnostics.Stopwatch]::StartNew()
  try {
    $resp = Invoke-RestMethod -Method Post -Uri "$Base/api/ai/strategies/generate" -Headers $Headers -Body $Body
    if ($resp.ok -eq $true) { $ok++ } else { $fail++ }
  } catch { $fail++ }
  $sw.Stop(); $dur += $sw.ElapsedMilliseconds
}
$dur_sorted = $dur | Sort-Object
$p95_idx = [int][Math]::Ceiling($dur_sorted.Count * 0.95) - 1
$p95 = if ($dur_sorted.Count -gt 0) { $dur_sorted[$p95_idx] } else { 0 }
Write-Host ("[*] OK={0} FAIL={1} p95(ms)={2}" -f $ok,$fail,$p95) -ForegroundColor Green
Write-Host "[*] Metrics snapshot:" -ForegroundColor Cyan
try {
  (Invoke-RestMethod -Uri "$Base/api/public/metrics/prom") -split "`n" |
    Select-String -Pattern "ai_generate_total|ai_latency_ms|ai_tokens_total" | Select-Object -First 20
} catch { Write-Host "metrics fetch failed" -ForegroundColor Yellow }
