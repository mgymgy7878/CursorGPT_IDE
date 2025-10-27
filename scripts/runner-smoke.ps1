$ErrorActionPreference="Stop"
mkdir evidence\runner -Force | Out-Null
"## Runner Smoke - $(Get-Date)" | Out-File evidence\runner\smoke.txt

# A) Kısa komut (başarılı)
node tools/runStep.cjs "Write-Host 'ping'; Start-Sleep -Seconds 1; Write-Host 'pong'" | Tee-Object -FilePath evidence\runner\smoke.txt -Append | Out-Null

# B) Takılma simülasyonu (idle>12s) – kill beklenir, exit 124
$env:RUNNER_IDLE_MS="12000"; $env:RUNNER_HARD_MS="20000"
node tools/runStep.cjs "Write-Host 'start'; Start-Sleep -Seconds 30" | Tee-Object -FilePath evidence\runner\smoke.txt -Append | Out-Null

# C) Kanıtların özeti
"`n## stall-events.tail(10)" | Add-Content evidence\runner\smoke.txt
Get-Content evidence\runner\stall-events.jsonl -Tail 10 | Add-Content evidence\runner\smoke.txt
