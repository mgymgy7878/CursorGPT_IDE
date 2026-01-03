# Release Gate SLO Policy - Minor'ları Zamanla Major'a Yükseltme
# 30 gün boyunca minor kalıyorsa artık Major'a yükselt (policy)

param(
  [string]$SloTrackingFile = "evidence/gate-slo-tracking.json"
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# SLO tracking dosyasını oku veya oluştur
$tracking = @{}
if (Test-Path $SloTrackingFile) {
  try {
    $tracking = Get-Content $SloTrackingFile -Raw | ConvertFrom-Json | ConvertTo-Hashtable
  } catch {
    $tracking = @{}
  }
}

# Gate çalıştır ve minor issue'ları al
$gateOutput = & powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-gate.ps1 -JsonOutput 2>&1
$gateJson = $gateOutput | ConvertFrom-Json

$now = Get-Date
$thirtyDaysAgo = $now.AddDays(-30)

# Her minor issue için tracking
foreach ($issue in $gateJson.issues) {
  if ($issue.severity -eq "minor") {
    $issueKey = $issue.message

    if (-not $tracking.ContainsKey($issueKey)) {
      # İlk görülme
      $tracking[$issueKey] = @{
        firstSeen = $now.ToString("o")
        lastSeen = $now.ToString("o")
        count = 1
      }
    } else {
      # Güncelle
      $tracking[$issueKey].lastSeen = $now.ToString("o")
      $tracking[$issueKey].count++

      # 30 gün geçti mi?
      $firstSeen = [DateTime]::Parse($tracking[$issueKey].firstSeen)
      if ($firstSeen -lt $thirtyDaysAgo) {
        Write-Host "[SLO] Minor issue 30+ gün boyunca devam ediyor, Major'a yükseltilmeli: $issueKey" -ForegroundColor Yellow
        Write-Host "  İlk görülme: $firstSeen" -ForegroundColor Gray
        Write-Host "  Toplam görülme: $($tracking[$issueKey].count)" -ForegroundColor Gray
      }
    }
  }
}

# Tracking dosyasını kaydet (klasör yoksa oluştur, .gitignore'da ignore edilmiş)
$trackingDir = Split-Path $SloTrackingFile -Parent
if (-not (Test-Path $trackingDir)) {
  New-Item -ItemType Directory -Force -Path $trackingDir | Out-Null
}

$tracking | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 -Path $SloTrackingFile

# Not: Bu dosya .gitignore'da ignore edilmiş (evidence/gate-slo-tracking.json)
# Herkesin lokalinde farklı tarih/istatistik → sürekli diff önlenir

Write-Host "`n[SLO] Tracking güncellendi: $SloTrackingFile" -ForegroundColor Green

