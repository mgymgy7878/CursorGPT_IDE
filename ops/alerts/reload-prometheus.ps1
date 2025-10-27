Param(
  [string]$Prom="http://127.0.0.1:9090",
  [string]$RulePath="ops/alerts/ai_generate_p95.yml"
)
# Ortama göre kural dizini farklı olabilir; gerektiğinde değiştirin.
$rulesDir = Join-Path (Split-Path $RulePath -Parent) "rules"
if (!(Test-Path $rulesDir)) { New-Item -ItemType Directory -Force -Path $rulesDir | Out-Null }
Copy-Item $RulePath -Destination $rulesDir -Force
try {
  Invoke-WebRequest -Method Post -Uri "$Prom/-/reload" | Out-Null
  Write-Host "Prometheus reloaded via /-/reload" -ForegroundColor Green
} catch {
  Write-Host "HTTP reload kapalı olabilir. SIGHUP gönderin veya Prometheus servisini yeniden başlatın." -ForegroundColor Yellow
}
