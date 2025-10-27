Param(
  [string]$WebBase = "http://127.0.0.1:3005",
  [string]$Auth = "dev-xyz",
  [int]$Iterations = 7,
  [string]$Prom = "http://127.0.0.1:9090"
)

$ErrorActionPreference = "Stop"
$stamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$evidenceDir = "docs/evidence/ai_generate"
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
$report = Join-Path $evidenceDir "health_$stamp.md"

Write-Host "[*] Canary ($Iterations x)..." -ForegroundColor Cyan
$Headers = @{ "Authorization" = "Bearer $Auth"; "Content-Type" = "application/json" }
$ok = 0; $fail = 0; $fallbacks = 0
for ($i=1; $i -le $Iterations; $i++) {
  $Body = @{ pair="BTCUSDT"; tf="15m"; style="trend"; provider="mock" } | ConvertTo-Json -Compress
  try {
    $resp = Invoke-RestMethod -Method Post -Uri "$WebBase/api/ai/strategies/generate" -Headers $Headers -Body $Body
    if ($resp.ok -eq $true) { $ok++ } else { $fail++ }
    if ($resp.fallback -eq $true) { $fallbacks++ }
  } catch { $fail++ }
}
Write-Host ("[*] Canary OK={0} FAIL={1} Fallback={2}" -f $ok,$fail,$fallbacks)

$metrics = ""
try { $metrics = Invoke-RestMethod -Uri "$WebBase/api/public/metrics/prom" } catch { Write-Host "Metrics fetch from UI failed." -ForegroundColor Yellow }

$p95 = ""; $ok5m = ""; $err4xx5m = ""; $err5xx5m = ""; $fallbackMark = ""
if ($Prom -and $Prom -ne "") {
  function Q($q) { (Invoke-RestMethod -Uri "$Prom/api/v1/query" -Method Get -Body @{ query = $q }).data.result.value[1] }
  try {
    $p95 = Q 'histogram_quantile(0.95, sum by (le) (rate(ai_latency_ms_bucket[5m])))'
    $ok5m = Q 'sum(increase(ai_generate_total{status="2xx"}[5m]))'
    $err4xx5m = Q 'sum(increase(ai_generate_total{status="4xx"}[5m]))'
    $err5xx5m = Q 'sum(increase(ai_generate_total{status="5xx"}[5m]))'
    $fallbackOpenAI = Q 'sum(increase(ai_generate_total{provider="openai",status="5xx"}[5m]))'
    $fallbackMock2xx = Q 'sum(increase(ai_generate_total{provider="mock",status="2xx"}[5m]))'
    if (($fallbackOpenAI -as [double]) -gt 0 -and ($fallbackMock2xx -as [double]) -gt 0) { $fallbackMark = "true" } else { $fallbackMark = "false" }
  } catch { Write-Host "Prometheus API sorgusu başarısız. p95/oranlar rapora dahil edilemedi." -ForegroundColor Yellow }
}

$lines = @()
$lines += "# AI Generate Sağlık Raporu — $stamp"
$lines += ""
$lines += "## TL;DR"
$lines += "- Canary: **OK=$ok**, **FAIL=$fail**, **Fallback=$fallbacks**"
if ($p95) { $lines += "- p95(latency): **$p95 ms** (son 5dk Prometheus)" }
if ($ok5m) { $lines += "- 5dk artışları → 2xx=$ok5m, 4xx=$err4xx5m, 5xx=$err5xx5m, fallback_mark=$fallbackMark" }
$lines += ""
$lines += "## Kanıt"
$lines += "- Web base: `$WebBase`"
$lines += "- Metrics snapshot (ilk 30 satır filtreli):"
if ($metrics) {
  $filtered = ($metrics -split "`n") | Select-String -Pattern "ai_generate_total|ai_latency_ms|ai_tokens_total" | Select-Object -First 30
  $lines += "```"
  $filtered | ForEach-Object { $lines += $_.ToString() }
  $lines += "```"
} else {
  $lines += "_metrics alınamadı_"
}
$lines += ""
$lines += "## Öneri"
$lines += "- Hedefler: p95 < **3000 ms**, error-rate < **%5**, fallback < **%5**, RL ihlali yok."
$lines += "- p95 > 3000ms ise: retry sayısını 2→1 düşürüp auto provider'ı **mock** lehine artırın; breaker penceresini 60s→90s deneyin."
Set-Content -Path $report -Value ($lines -join "`r`n") -Encoding UTF8

Write-Host "[✓] Rapor üretildi: $report" -ForegroundColor Green
