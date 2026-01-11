param(
  [string]$MetricsUrl = "http://localhost:3003/api/public/metrics.prom",
  [string]$OutDir = "artifacts\gateD",
  [int]$AutoWaitSeconds = 0,
  [switch]$NoPrompt
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ensure-Dir($p) {
  if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null }
}

function Get-MetricsText([string]$url) {
  try {
    (Invoke-WebRequest -UseBasicParsing -Uri $url).Content
  } catch {
    Write-Error "Failed to fetch metrics from $url : $_"
    exit 1
  }
}

function Parse-MetricLine([string]$line) {
  # returns @{ name=""; labels=@{k=v}; value=[double] } or $null
  $re = '^(?<name>[a-zA-Z_:][a-zA-Z0-9_:]*)(?<labels>\{.*\})?\s+(?<value>[-+]?\d+(\.\d+)?([eE][-+]?\d+)?)\s*$'
  $m = [regex]::Match($line, $re)
  if (-not $m.Success) { return $null }

  $labels = @{}
  if ($m.Groups["labels"].Success) {
    $raw = $m.Groups["labels"].Value.Trim('{}')
    if ($raw.Length -gt 0) {
      # naive label parse: key="value",key2="value2"
      $parts = $raw -split '",(?![^"]*")' | ForEach-Object { $_.Trim() }
      foreach ($p in $parts) {
        $pp = $p.Trim(',')
        if ($pp -match '^(?<k>[a-zA-Z_][a-zA-Z0-9_]*)="(?<v>.*)"$') {
          $labels[$Matches["k"]] = $Matches["v"]
        }
      }
    }
  }

  return @{
    name   = $m.Groups["name"].Value
    labels = $labels
    value  = [double]$m.Groups["value"].Value
  }
}

function Extract-Interesting([string]$text) {
  $interesting = @(
    "spark_copilot_sse_stream_open_total",
    "spark_copilot_sse_stream_close_total",
    "spark_copilot_sse_stream_active",
    "spark_copilot_sse_event_total",
    "spark_copilot_sse_invalid_drop_total",
    "spark_copilot_sse_bytes_total",
    "spark_copilot_sse_duration_seconds"
  )

  $rows = @()
  foreach ($line in ($text -split "`n")) {
    $l = $line.Trim()
    if ($l.Length -eq 0 -or $l.StartsWith("#")) { continue }
    $p = Parse-MetricLine $l
    if ($null -eq $p) { continue }
    if ($interesting -contains $p.name) { $rows += $p }
  }
  return $rows
}

function KeyOf($row) {
  # stable key for label-metrics
  if ($row.labels.Count -eq 0) { return $row.name }
  $pairs = $row.labels.Keys | Sort-Object | ForEach-Object { "$_=$($row.labels[$_])" }
  return "$($row.name){$([string]::Join(",", $pairs))}"
}

Ensure-Dir $OutDir
$ts = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "Gate D Metrics Smoke Test"
Write-Host "========================="
Write-Host "Metrics URL: $MetricsUrl"
Write-Host "OutDir: $OutDir"
Write-Host ""

Write-Host "1) Baseline alınıyor..."
$beforeText = Get-MetricsText $MetricsUrl
$beforePath = Join-Path $OutDir "metrics_before_$ts.prom"
$beforeText | Out-File -Encoding utf8 $beforePath

Write-Host "   Baseline kaydedildi: $beforePath"
Write-Host ""

# Auto-wait or prompt for manual test
if ($NoPrompt -or $AutoWaitSeconds -gt 0) {
  if ($AutoWaitSeconds -gt 0) {
    Write-Host "2) Auto-wait mode: Triggering mock SSE stream automatically..."
    Write-Host ""

    # Trigger mock SSE stream using gate-d-test-mock-sse.ps1
    $testScript = Join-Path $PSScriptRoot "gate-d-test-mock-sse.ps1"
    if (Test-Path $testScript) {
      Write-Host "   Running: .\tools\gate-d-test-mock-sse.ps1" -ForegroundColor Cyan
      & $testScript | Out-Null
      Write-Host "   ✅ Mock stream triggered" -ForegroundColor Green
    } else {
      Write-Host "   ⚠️  gate-d-test-mock-sse.ps1 not found, waiting $AutoWaitSeconds seconds..." -ForegroundColor Yellow
      Write-Host "   Trigger SSE manually during this time" -ForegroundColor Gray
      Start-Sleep -Seconds $AutoWaitSeconds
    }

    Write-Host ""
    Write-Host "   Waiting 2 seconds for metrics to update..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
  } else {
    Write-Host "2) No-prompt mode: Skipping wait."
    Write-Host "   Verify mock mode is active (check server logs for '[MOCK SSE]')"
    Write-Host "   Trigger SSE manually before continuing..."
    Start-Sleep -Seconds 2
  }
} else {
  Write-Host "2) SSE testlerini yapın:"
  Write-Host "   - Copilot'a mesaj gönder (stream başlat)"
  Write-Host "   - Cancel/abort yap"
  Write-Host "   - Normal tamamla"
  Write-Host ""
  Read-Host "   Bitince ENTER'a basın"
}

Write-Host ""
Write-Host "3) After snapshot alınıyor..."
$afterText = Get-MetricsText $MetricsUrl
$afterPath = Join-Path $OutDir "metrics_after_$ts.prom"
$afterText | Out-File -Encoding utf8 $afterPath
Write-Host "   After kaydedildi: $afterPath"

$before = Extract-Interesting $beforeText
$after  = Extract-Interesting $afterText

$beforeMap = @{}
foreach ($r in $before) { $beforeMap[(KeyOf $r)] = $r.value }

$afterMap = @{}
foreach ($r in $after)  { $afterMap[(KeyOf $r)] = $r.value }

$allKeys = @($beforeMap.Keys + $afterMap.Keys) | Sort-Object -Unique
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("Gate D Metrics Delta Summary")
$lines.Add("=============================")
$lines.Add("Timestamp: $ts")
$lines.Add("MetricsUrl: $MetricsUrl")
$lines.Add("Before: $beforePath")
$lines.Add("After : $afterPath")
$lines.Add("")

$hasChanges = $false
foreach ($k in $allKeys) {
  $b = if ($beforeMap.ContainsKey($k)) { $beforeMap[$k] } else { 0 }
  $a = if ($afterMap.ContainsKey($k))  { $afterMap[$k] }  else { 0 }
  $d = $a - $b
  if ([math]::Abs($d) -gt 0.0001) {
    $hasChanges = $true
    $lines.Add(("{0,-80}  before={1,10}  after={2,10}  delta={3,10}" -f $k, $b, $a, $d))
  }
}

if (-not $hasChanges) {
  $lines.Add("WARNING: No metric changes detected!")
  $lines.Add("Possible reasons:")
  $lines.Add("  - Mock stream not active (check server logs for '[MOCK SSE]')")
  $lines.Add("  - Env vars set in wrong terminal or server not restarted")
  $lines.Add("  - SSE stream not triggered (run .\tools\gate-d-test-mock-sse.ps1 to test)")
  $lines.Add("  - Metrics endpoint incorrect")
  $lines.Add("  - Registry was reset (HMR/dev reload)")
}

$sumPath = Join-Path $OutDir "smoke_metrics_summary_$ts.txt"
$lines | Out-File -Encoding utf8 $sumPath

Write-Host ""
Write-Host "Delta summary kaydedildi: $sumPath"
Write-Host ""
if ($hasChanges) {
  Write-Host "✅ Metric değişiklikleri tespit edildi!" -ForegroundColor Green
  $lines | Where-Object { $_ -notmatch "^Gate D|^===|^Timestamp|^MetricsUrl|^Before|^After|^$" } | ForEach-Object { Write-Host $_ }
} else {
  Write-Host "⚠️  Metric değişikliği tespit edilmedi." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Troubleshooting:" -ForegroundColor Yellow
  Write-Host "  1. Verify mock stream is active:" -ForegroundColor Gray
  Write-Host "     Check server logs for '[MOCK SSE] Mock stream mode enabled'" -ForegroundColor Gray
  Write-Host "  2. Test SSE stream manually:" -ForegroundColor Gray
  Write-Host "     .\tools\gate-d-test-mock-sse.ps1" -ForegroundColor Gray
  Write-Host "  3. Verify env vars were set BEFORE server start:" -ForegroundColor Gray
  Write-Host "     SPARK_COPILOT_MOCK_STREAM=1 (in same terminal as dev server)" -ForegroundColor Gray
  Write-Host "  4. Trigger SSE stream:" -ForegroundColor Gray
  Write-Host "     Browser: http://127.0.0.1:3003/dashboard -> Copilot -> Send message" -ForegroundColor Gray
  Write-Host "     Or: curl -N -H 'Content-Type: application/json' -d '{\"message\":\"test\"}' http://127.0.0.1:3003/api/copilot/chat" -ForegroundColor Gray
}
Write-Host ""

