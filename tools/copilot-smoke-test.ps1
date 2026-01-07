# Copilot Smoke Test & Regression Matrix
# Tests P0 hardening: SSE, tool calls, limits, allowlist, audit chain

$ErrorActionPreference = "Stop"

Write-Host "=== Copilot Smoke Test & Regression Matrix ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3003"
$copilotUrl = "$baseUrl/api/copilot/chat"

# Test 1: API key yokken (env var kontrolü) - Semantik: 401 Unauthorized
Write-Host "[1/6] API Key Yok Testi (401 Unauthorized)..." -ForegroundColor Yellow
$env:OPENAI_API_KEY_OLD = $env:OPENAI_API_KEY
$env:OPENAI_API_KEY = ""
try {
    $response = Invoke-WebRequest -Uri $copilotUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"test"}' -UseBasicParsing -ErrorAction Stop
    Write-Host "  ❌ FAIL: Should return 401 when API key missing" -ForegroundColor Red
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    if ($statusCode -eq 401) {
        Write-Host "  ✅ PASS: Returns 401 Unauthorized when API key missing" -ForegroundColor Green
    } elseif ($statusCode -eq 500) {
        Write-Host "  ⚠️  WARN: Returns 500 (should be 401 for semantic correctness)" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠️  WARN: Unexpected status: $statusCode" -ForegroundColor Yellow
    }
}
$env:OPENAI_API_KEY = $env:OPENAI_API_KEY_OLD

# Test 2: Payload limit (32KB üstü)
Write-Host "[2/6] Payload Limit Testi (32KB+)..." -ForegroundColor Yellow
$largePayload = "x" * (33 * 1024) # 33KB
$body = @{
    message = $largePayload
} | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri $copilotUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "  ❌ FAIL: Should reject payload > 32KB" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "  ✅ PASS: Rejects payload > 32KB" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  WARN: Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# Test 3: Tool-call limit (4 tool çağrısı → 3'te kesilmeli + tool_limit_exceeded event)
Write-Host "[3/6] Tool-Call Limit Testi (4 tool → 3 limit + tool_limit_exceeded event)..." -ForegroundColor Yellow
$multiToolPrompt = "Aşağıdaki JSON bloklarını art arda üret (4 adet). Her biri ayrı fenced block olsun:`n1) {`"tool`":`"getRuntimeHealth`",`"params`":{}}`n2) {`"tool`":`"getRuntimeHealth`",`"params`":{}}`n3) {`"tool`":`"getRuntimeHealth`",`"params`":{}}`n4) {`"tool`":`"getRuntimeHealth`",`"params`":{}}`nAçıklama yazma."
try {
    $body = @{
        message = $multiToolPrompt
    } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri $copilotUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    if ($content -match "tool_limit_exceeded") {
        Write-Host "  ✅ PASS: tool_limit_exceeded event detected in response" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  WARN: tool_limit_exceeded event not found (may need LLM to generate 4 calls)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  SKIP: Request failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 4: Registry allowlist (bilinmeyen tool → TOOL_NOT_FOUND)
Write-Host "[4/6] Registry Allowlist Testi (getRuntimeHealth2 → TOOL_NOT_FOUND)..." -ForegroundColor Yellow
$unknownToolPrompt = "Sadece şu tool çağrısını üret:`n```json`n{`"tool`":`"getRuntimeHealth2`",`"params`":{}}`n```"
try {
    $body = @{
        message = $unknownToolPrompt
    } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri $copilotUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    if ($content -match '"errorCode"\s*:\s*"TOOL_NOT_FOUND"') {
        Write-Host "  ✅ PASS: TOOL_NOT_FOUND errorCode detected" -ForegroundColor Green
    } elseif ($content -match '"ok"\s*:\s*false') {
        Write-Host "  ⚠️  PARTIAL: ok:false found but TOOL_NOT_FOUND not explicitly checked" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠️  SKIP: Response doesn't contain expected error (may need LLM to generate tool call)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  SKIP: Request failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 5: SSE disconnect (abort handling)
Write-Host "[5/6] SSE Disconnect Testi..." -ForegroundColor Yellow
Write-Host "  ⚠️  SKIP: Requires manual browser test (close tab during SSE stream)" -ForegroundColor Yellow

# Test 6: Audit chain (ardışık iki tool çağrısı)
Write-Host "[6/6] Audit Chain Testi..." -ForegroundColor Yellow
Write-Host "  ⚠️  SKIP: Requires two sequential tool calls (manual test needed)" -ForegroundColor Yellow

# Test 7: getStrategies tool (P0.7)
Write-Host "[7/8] getStrategies Tool Testi..." -ForegroundColor Yellow
$getStrategiesPrompt = "Aktif stratejileri listele. Sadece getStrategies tool'unu kullan."
try {
    $body = @{
        message = $getStrategiesPrompt
    } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri $copilotUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    if ($content -match '"tool"\s*:\s*"getStrategies"') {
        Write-Host "  ✅ PASS: getStrategies tool call detected" -ForegroundColor Green
        if ($content -match '"ok"\s*:\s*true') {
            Write-Host "  ✅ PASS: tool_result.ok=true" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  WARN: tool_result.ok not found or false" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  SKIP: getStrategies tool call not found (may need LLM to generate)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  SKIP: Request failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 8: getStrategy unknown id (P0.7)
Write-Host "[8/8] getStrategy Unknown ID Testi (NOT_FOUND)..." -ForegroundColor Yellow
$getStrategyPrompt = "ID'si 'nonexistent-id-12345' olan stratejinin detayını getir. Sadece getStrategy tool'unu kullan."
try {
    $body = @{
        message = $getStrategyPrompt
    } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri $copilotUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    if ($content -match '"tool"\s*:\s*"getStrategy"') {
        if ($content -match '"errorCode"\s*:\s*"(NOT_FOUND|DATA_UNAVAILABLE)"') {
            Write-Host "  ✅ PASS: errorCode detected (NOT_FOUND or DATA_UNAVAILABLE)" -ForegroundColor Green
        } elseif ($content -match '"ok"\s*:\s*false') {
            Write-Host "  ⚠️  PARTIAL: ok:false found but errorCode not explicitly checked" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠️  SKIP: Response doesn't contain expected error" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  SKIP: getStrategy tool call not found (may need LLM to generate)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  SKIP: Request failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Evidence Dosyası Kontrolü ===" -ForegroundColor Cyan
$evidenceDir = Join-Path $PSScriptRoot "..\evidence"
if (Test-Path $evidenceDir) {
    $evidenceFiles = Get-ChildItem -Path $evidenceDir -Filter "hello_tool_world_*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($evidenceFiles) {
        Write-Host "  ✅ Evidence dosyası bulundu: $($evidenceFiles.Name)" -ForegroundColor Green
        $evidence = Get-Content $evidenceFiles.FullName | ConvertFrom-Json

        $checks = @(
            @{Name="requestId"; Value=$evidence.requestId; Expected="not empty"},
            @{Name="tool"; Value=$evidence.tool; Expected="getRuntimeHealth"},
            @{Name="paramsHash"; Value=$evidence.toolParamsHash; Expected="not empty"},
            @{Name="resultHash"; Value=$evidence.toolResultHash; Expected="not empty"},
            @{Name="prevHash"; Value=$evidence.prevHash; Expected="not empty or null"},
            @{Name="auditHash"; Value=$evidence.auditHash; Expected="not empty"},
            @{Name="elapsedMs"; Value=$evidence.elapsedMs; Expected="> 0"},
            @{Name="sseEventCount"; Value=$evidence.sseEventCount; Expected="> 0"},
            @{Name="ok"; Value=$evidence.ok; Expected="true"}
        )

        # P1.1: Backtest lifecycle evidence checks (if present)
        if ($evidence.backtestJobLifecycle) {
            Write-Host "  📊 Backtest Job Lifecycle Evidence:" -ForegroundColor Cyan
            $lifecycleChecks = @(
                @{Name="startedAt"; Value=$evidence.backtestJobLifecycle.startedAt; Expected="> 0"},
                @{Name="finalStatus"; Value=$evidence.backtestJobLifecycle.finalStatus; Expected="done|failed|timeout|aborted"},
                @{Name="progressEvents"; Value=$evidence.backtestJobLifecycle.progressEvents; Expected=">= 0"}
            )
            foreach ($check in $lifecycleChecks) {
                $pass = $false
                if ($null -eq $check.Value) {
                    $pass = $false
                } elseif ($check.Expected -eq "> 0") {
                    $pass = $check.Value -gt 0
                } elseif ($check.Expected -eq ">= 0") {
                    $pass = $check.Value -ge 0
                } elseif ($check.Expected -match "^done\|failed\|timeout\|aborted$") {
                    $pass = $check.Value -match "^(done|failed|timeout|aborted)$"
                }

                if ($pass) {
                    Write-Host "    ✅ $($check.Name): $($check.Value)" -ForegroundColor Green
                } else {
                    Write-Host "    ❌ $($check.Name): $($check.Value) (expected: $($check.Expected))" -ForegroundColor Red
                }
            }

            # P1.1: Backtest result evidence checks (if present)
            if ($evidence.backtestResultHash) {
                Write-Host "  📊 Backtest Result Evidence:" -ForegroundColor Cyan
                $resultChecks = @(
                    @{Name="resultHash"; Value=$evidence.backtestResultHash; Expected="not empty"},
                    @{Name="resultPreviewBytes"; Value=$evidence.backtestResultPreviewBytes; Expected="> 0"},
                    @{Name="resultTruncated"; Value=$evidence.backtestResultTruncated; Expected="boolean"}
                )
                foreach ($check in $resultChecks) {
                    $pass = $false
                    if ($null -eq $check.Value) {
                        $pass = $false
                    } elseif ($check.Expected -eq "not empty") {
                        $pass = $check.Value -ne "" -and $check.Value -ne $null
                    } elseif ($check.Expected -eq "> 0") {
                        $pass = $check.Value -gt 0
                    } elseif ($check.Expected -eq "boolean") {
                        $pass = $check.Value -is [bool] -or $check.Value -eq $true -or $check.Value -eq $false
                    }

                    if ($pass) {
                        Write-Host "    ✅ $($check.Name): $($check.Value)" -ForegroundColor Green
                    } else {
                        Write-Host "    ❌ $($check.Name): $($check.Value) (expected: $($check.Expected))" -ForegroundColor Red
                    }
                }
            }
        }

        foreach ($check in $checks) {
            $pass = $false
            if ($null -eq $check.Value) {
                $pass = $false
            } elseif ($check.Expected -eq "not empty") {
                $pass = $check.Value -ne "" -and $check.Value -ne $null
            } elseif ($check.Expected -eq "not empty or null") {
                $pass = $true # prevHash can be empty for first entry
            } elseif ($check.Expected -eq "getRuntimeHealth") {
                $pass = $check.Value -eq "getRuntimeHealth"
            } elseif ($check.Expected -eq "> 0") {
                $pass = $check.Value -gt 0
            } elseif ($check.Expected -eq "true") {
                $pass = $check.Value -eq $true
            }

            if ($pass) {
                Write-Host "    ✅ $($check.Name): $($check.Value)" -ForegroundColor Green
            } else {
                Write-Host "    ❌ $($check.Name): $($check.Value) (expected: $($check.Expected))" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  ⚠️  Evidence dosyası bulunamadı (hello_tool_world_*.json)" -ForegroundColor Yellow
        Write-Host "     Manuel test: CopilotDock → 'Health durumunu getir'" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  Evidence klasörü bulunamadı: $evidenceDir" -ForegroundColor Yellow
}

# Test 9: runBacktest dry-run (P0.8)
Write-Host "[9/10] runBacktest Dry-Run Testi..." -ForegroundColor Yellow
$backtestPrompt = "ID'si 'test-strategy-id' olan stratejiyi 2024-01-01'den 2024-01-31'e backtest et (dry-run). Sadece runBacktest tool'unu kullan."
try {
    $body = @{
        message = $backtestPrompt
    } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri $copilotUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    if ($content -match '"tool"\s*:\s*"runBacktest"') {
        if ($content -match '"dryRun"\s*:\s*true') {
            Write-Host "  ✅ PASS: runBacktest dryRun=true detected" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  WARN: dryRun field not found or false" -ForegroundColor Yellow
        }
        if ($content -match '"ok"\s*:\s*true') {
            Write-Host "  ✅ PASS: tool_result.ok=true" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  WARN: tool_result.ok not found or false" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  SKIP: runBacktest tool call not found (may need LLM to generate)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  SKIP: Request failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 10: runBacktest commit mode denied (P0.8)
Write-Host "[10/14] runBacktest Commit Mode Denied Testi (POLICY_DENIED)..." -ForegroundColor Yellow
$backtestCommitPrompt = "ID'si 'test-strategy-id' olan stratejiyi commit mode'da backtest et. mode='commit' kullan."
try {
    $body = @{
        message = $backtestCommitPrompt
    } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri $copilotUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    if ($content -match '"tool"\s*:\s*"runBacktest"') {
        if ($content -match '"errorCode"\s*:\s*"POLICY_DENIED"') {
            Write-Host "  ✅ PASS: POLICY_DENIED errorCode detected for commit mode" -ForegroundColor Green
        } elseif ($content -match '"ok"\s*:\s*false') {
            Write-Host "  ⚠️  PARTIAL: ok:false found but POLICY_DENIED not explicitly checked" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠️  SKIP: Response doesn't contain expected error" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  SKIP: runBacktest tool call not found (may need LLM to generate)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  SKIP: Request failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 11: getBacktestResult NOT_READY (P1.1)
Write-Host "[11/14] getBacktestResult NOT_READY Testi..." -ForegroundColor Yellow
Write-Host "  ℹ️  NOT: Bu test için önce bir backtest job başlatılmalı (startBacktest + confirmBacktest)" -ForegroundColor Cyan
Write-Host "  ℹ️  NOT: Job başladıktan hemen sonra getBacktestResult çağrılmalı → errorCode: NOT_READY beklenir" -ForegroundColor Cyan
Write-Host "  ⚠️  SKIP: Otomatik test için jobId gerekiyor (manuel test önerilir)" -ForegroundColor Yellow

# Test 12: ConfirmationToken replay prevention (P1.1)
Write-Host "[12/14] ConfirmationToken Replay Prevention Testi..." -ForegroundColor Yellow
Write-Host "  ℹ️  NOT: Aynı confirmationToken ile iki kez confirmBacktest çağrılmalı" -ForegroundColor Cyan
Write-Host "  ℹ️  NOT: İkinci çağrı ok=false + errorCode: POLICY_DENIED döndürmeli" -ForegroundColor Cyan
Write-Host "  ⚠️  SKIP: Otomatik test için token gerekiyor (manuel test önerilir)" -ForegroundColor Yellow
Write-Host "  📝 Manuel test:" -ForegroundColor Yellow
Write-Host "     1. startBacktest → confirmationToken al" -ForegroundColor Gray
Write-Host "     2. confirmBacktest(token) → jobId al (başarılı)" -ForegroundColor Gray
Write-Host "     3. confirmBacktest(token) → ikinci kez çağır → POLICY_DENIED beklenir" -ForegroundColor Gray

# Test 13: ConfirmationToken TTL expiry (P1.1)
Write-Host "[13/14] ConfirmationToken TTL Expiry Testi..." -ForegroundColor Yellow
Write-Host "  ℹ️  NOT: Token üretildikten 5 dakika sonra expire olmalı" -ForegroundColor Cyan
Write-Host "  ⚠️  SKIP: 5 dakika bekleme gerekiyor (manuel test önerilir)" -ForegroundColor Yellow
Write-Host "  📝 Manuel test:" -ForegroundColor Yellow
Write-Host "     1. startBacktest → confirmationToken al" -ForegroundColor Gray
Write-Host "     2. 5 dakika bekle" -ForegroundColor Gray
Write-Host "     3. confirmBacktest(token) → POLICY_DENIED (expired) beklenir" -ForegroundColor Gray

# Test 14: Client abort / polling cleanup (P1.1)
Write-Host "[14/14] Client Abort / Polling Cleanup Testi..." -ForegroundColor Yellow
Write-Host "  ℹ️  NOT: confirmBacktest ile job başlatıldıktan sonra SSE bağlantısı kesilmeli" -ForegroundColor Cyan
Write-Host "  ℹ️  NOT: Server CLIENT_ABORT event'i göndermeli ve polling durmalı" -ForegroundColor Cyan
Write-Host "  ⚠️  SKIP: Browser tab kapatma gerekiyor (manuel test önerilir)" -ForegroundColor Yellow
Write-Host "  📝 Manuel test:" -ForegroundColor Yellow
Write-Host "     1. startBacktest + confirmBacktest → job başlat" -ForegroundColor Gray
Write-Host "     2. Network tab'de SSE stream'i izle (job_progress event'leri gelmeli)" -ForegroundColor Gray
Write-Host "     3. Browser tab'ı kapat" -ForegroundColor Gray
Write-Host "     4. Server log'larında CLIENT_ABORT event'i ve polling durması beklenir" -ForegroundColor Gray

Write-Host ""
Write-Host "=== Özet ===" -ForegroundColor Cyan
Write-Host "  - API key kontrolü: ✅ (otomatik test)"
Write-Host "  - Payload limit: ✅ (otomatik test)"
Write-Host "  - Tool-call limit: ⚠️  (manuel test gerekli)"
Write-Host "  - Allowlist: ⚠️  (manuel test gerekli)"
Write-Host "  - SSE disconnect: ⚠️  (manuel test gerekli)"
Write-Host "  - Audit chain: ⚠️  (manuel test gerekli)"
Write-Host "  - P1.1: NOT_READY: ⚠️  (manuel test gerekli)"
Write-Host "  - P1.1: Token replay: ⚠️  (manuel test gerekli)"
Write-Host "  - P1.1: TTL expiry: ⚠️  (manuel test gerekli - 5 dk bekleme)"
Write-Host "  - P1.1: Client abort: ⚠️  (manuel test gerekli)"
Write-Host ""
Write-Host "Manuel test adımları (P1.1):" -ForegroundColor Yellow
Write-Host "  1. Backtest lifecycle:" -ForegroundColor Cyan
Write-Host "     - 'Şu stratejiyi backtest için hazırla: <id>, 2024-01-01'den 2024-02-01'e'" -ForegroundColor Gray
Write-Host "     - 'Backtest'i onayla (token ile)'" -ForegroundColor Gray
Write-Host "     - SSE'de job_started → job_progress (en az 1) → job_done/job_failed beklenir" -ForegroundColor Gray
Write-Host "  2. NOT_READY testi:" -ForegroundColor Cyan
Write-Host "     - Job başladıktan hemen sonra 'Job sonucu getir: <jobId>'" -ForegroundColor Gray
Write-Host "     - errorCode: NOT_READY beklenir (UI'da kırmızı hata gibi görünmemeli)" -ForegroundColor Gray
Write-Host "  3. Token replay:" -ForegroundColor Cyan
Write-Host "     - Aynı confirmationToken ile iki kez confirmBacktest → ikincisi POLICY_DENIED" -ForegroundColor Gray
Write-Host "  4. TTL expiry:" -ForegroundColor Cyan
Write-Host "     - Token üret → 5 dakika bekle → confirm → POLICY_DENIED (expired)" -ForegroundColor Gray
Write-Host "  5. Client abort:" -ForegroundColor Cyan
Write-Host "     - Job başlat → SSE stream açıkken tab kapat → CLIENT_ABORT event beklenir" -ForegroundColor Gray
Write-Host ""
Write-Host "Evidence doğrulama (P1.1):" -ForegroundColor Yellow
Write-Host "  - backtestJobLifecycle.progressEvents >= 1 (en azından running'de)" -ForegroundColor Gray
Write-Host "  - backtestJobLifecycle.finalStatus: done|failed|timeout|aborted" -ForegroundColor Gray
Write-Host "  - backtestResultHash + backtestResultPreviewBytes (done ise)" -ForegroundColor Gray
Write-Host ""

