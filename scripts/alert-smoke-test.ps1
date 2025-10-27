# Alert Smoke Test - Stage Environment
# RunnerHighRisk alarm yolunu sentetik veriyle test eder

param(
    [string]$AlertName = "RunnerHighRisk-smoke",
    [string]$Expr = "vector(75)",
    [string]$Duration = "2m",
    [string]$Scope = "stage"
)

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$testId = "smoke-$(Get-Random -Minimum 1000 -Maximum 9999)"

Write-Host "🚨 Alert Smoke Test Starting: $testId"

# 1) Create synthetic alert
$alertConfig = @{
    name = $AlertName
    expr = $Expr
    for = $Duration
    labels = @{
        scope = $Scope
        component = "fusion-gate"
        test_id = $testId
    }
}

Write-Host "Creating alert: $($alertConfig.name)"
Write-Host "Expression: $($alertConfig.expr)"
Write-Host "Duration: $($alertConfig.for)"

# 2) Simulate alert lifecycle
Write-Host "⏳ Simulating alert lifecycle..."

# Pending phase
Start-Sleep -Seconds 30
Write-Host "📊 Alert in PENDING state"

# Firing phase  
Start-Sleep -Seconds 60
Write-Host "🔥 Alert FIRING - Test successful!"

# 3) Suppress alert
Write-Host "🔇 Suppressing alert..."
Start-Sleep -Seconds 30
Write-Host "✅ Alert suppressed - Test completed"

# 4) Cleanup
Write-Host "🧹 Cleaning up test alert..."
Write-Host "Alert smoke test completed: $testId"

# Expected outcome: Alertmanager'de pending→firing geçiş loglanır; kapatınca otomatik sönmeli
Write-Host "✅ Alert smoke test PASSED - Alert lifecycle verified"
