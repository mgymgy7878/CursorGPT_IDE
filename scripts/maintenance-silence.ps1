$ErrorActionPreference = "Stop"
param(
  [string]$AlertmanagerUrl = "http://127.0.0.1:9093",
  [int]$DurationMinutes = 120,
  [string]$Service = "executor",
  [string]$Env = "prod",
  [string]$Comment = "maintenance"
)

$start = (Get-Date).ToUniversalTime().ToString("o")
$end = (Get-Date).ToUniversalTime().AddMinutes($DurationMinutes).ToString("o")
$payload = @{
  matchers = @(
    @{ name = 'service'; value = $Service; isRegex = $false },
    @{ name = 'env'; value = $Env; isRegex = $false }
  )
  startsAt = $start
  endsAt = $end
  createdBy = 'spark-maintenance'
  comment = $Comment
} | ConvertTo-Json -Depth 4

Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$AlertmanagerUrl/api/v2/silences" -ContentType "application/json" -Body $payload
Write-Host "Silence created for $Service/$Env until $end"


