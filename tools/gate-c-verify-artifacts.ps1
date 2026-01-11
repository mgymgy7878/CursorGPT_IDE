# Gate C Smoke Test - Artifact Verification Script
# Testler tamamlandıktan sonra kanıt dosyalarını kontrol eder
# "Kanıt kalitesi polisi" - placeholder, boş dosya, tutarlılık kontrolü

$ErrorActionPreference = "Stop"

Write-Host "=== Gate C Smoke Test - Artifact Verification ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

$artifactsDir = "artifacts\gateC"
$evidenceDir = "evidence"

$allPass = $true
$testResults = @{
    "T1" = "UNKNOWN"
    "T2" = "UNKNOWN"
    "T3" = "UNKNOWN"
}

# Artifact kontrolü (boyut + varlık)
Write-Host "`n[CHECK] Artifacts (Size + Existence)..." -ForegroundColor Yellow

$requiredArtifacts = @(
    @{Path = "$artifactsDir\t1_network.png"; Name = "TEST 1 Screenshot"; MinSize = 10KB},
    @{Path = "$artifactsDir\t2_console.txt"; Name = "TEST 2 Console Log"; MinSize = 1KB},
    @{Path = "$artifactsDir\t3_limits.png"; Name = "TEST 3 Screenshot"; MinSize = 10KB}
)

foreach ($artifact in $requiredArtifacts) {
    if (Test-Path $artifact.Path) {
        $size = (Get-Item $artifact.Path).Length
        $minSize = $artifact.MinSize

        if ($size -ge $minSize) {
            Write-Host "  ✅ $($artifact.Name): $($artifact.Path) ($size bytes)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $($artifact.Name): TOO SMALL ($size bytes, expected >= $minSize)" -ForegroundColor Yellow
            Write-Host "      Possible placeholder or incomplete file" -ForegroundColor Gray
            $allPass = $false
        }
    } else {
        Write-Host "  ❌ $($artifact.Name): MISSING" -ForegroundColor Red
        $allPass = $false
    }
}

# NetLog kontrolü (opsiyonel ama önerilir)
Write-Host "`n[CHECK] NetLog File..." -ForegroundColor Yellow
$netlogFiles = Get-ChildItem -Path $artifactsDir -Filter "netlog_gateC_*.json" -ErrorAction SilentlyContinue
if ($netlogFiles) {
    $netlogFile = $netlogFiles[0].FullName
    $size = (Get-Item $netlogFile).Length
    if ($size -ge 100KB) {
        Write-Host "  ✅ NetLog: $netlogFile ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  NetLog: TOO SMALL ($size bytes, expected >= 100KB)" -ForegroundColor Yellow
        Write-Host "      Possible incomplete capture (Edge closed too early?)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️  NetLog: Not found (opsiyonel but recommended)" -ForegroundColor Yellow
}

# Evidence dosyaları kontrolü (placeholder + status + tutarlılık)
Write-Host "`n[CHECK] Evidence Files (Placeholder + Status + Consistency)..." -ForegroundColor Yellow

$evidenceFiles = @(
    @{Path = "$evidenceDir\gateC_dual_panel_single_stream.txt"; Name = "TEST 1 Evidence"; TestId = "T1"},
    @{Path = "$evidenceDir\gateC_abort_idle_no_error_event.txt"; Name = "TEST 2 Evidence"; TestId = "T2"},
    @{Path = "$evidenceDir\gateC_limits_enforced.txt"; Name = "TEST 3 Evidence"; TestId = "T3"}
)

$placeholderPatterns = @(
    "<BADGE_REQUEST_ID>",
    "\[PASS/FAIL.*?\]",
    "STATUS: TBD",
    "\[RECORD HERE\]",
    "\[PASTE.*?\]",
    "requestId: ___"
)

foreach ($evidence in $evidenceFiles) {
    if (Test-Path $evidence.Path) {
        $content = Get-Content $evidence.Path -Raw

        # Placeholder kontrolü
        $hasPlaceholder = $false
        foreach ($pattern in $placeholderPatterns) {
            if ($content -match $pattern) {
                Write-Host "  ⚠️  $($evidence.Name): PLACEHOLDER DETECTED ($pattern)" -ForegroundColor Yellow
                $hasPlaceholder = $true
                $allPass = $false
                break
            }
        }

        if (-not $hasPlaceholder) {
            # Status kontrolü
            if ($content -match "Status:\s*(PASS|FAIL)") {
                $status = $matches[1]
                $testResults[$evidence.TestId] = $status

                if ($status -eq "PASS") {
                    Write-Host "  ✅ $($evidence.Name): PASS" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ $($evidence.Name): FAIL" -ForegroundColor Red
                    $allPass = $false
                }
            } else {
                Write-Host "  ⚠️  $($evidence.Name): Status not set or invalid format" -ForegroundColor Yellow
                $allPass = $false
            }

            # RequestId kontrolü
            if ($content -match "requestId:\s*([^\s_<>]+)") {
                $requestId = $matches[1]
                if ($requestId -notmatch "req_\d+") {
                    Write-Host "      RequestId: Found but format unusual ($requestId)" -ForegroundColor Yellow
                } else {
                    Write-Host "      RequestId: Found ($requestId)" -ForegroundColor Gray
                }
            } else {
                Write-Host "      RequestId: Missing or placeholder" -ForegroundColor Yellow
            }

            # Artifact referansı kontrolü
            $artifactRefs = @{
                "T1" = "t1_network\.png"
                "T2" = "t2_console\.txt"
                "T3" = "t3_limits\.png"
            }
            if ($content -match $artifactRefs[$evidence.TestId]) {
                Write-Host "      Artifact reference: Found" -ForegroundColor Gray
            } else {
                Write-Host "      Artifact reference: Missing" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ❌ $($evidence.Name): File not found" -ForegroundColor Red
        $allPass = $false
    }
}

# Summary dosyası kontrolü
Write-Host "`n[CHECK] Summary File..." -ForegroundColor Yellow
$summaryFile = "$evidenceDir\gateC_smoke_test_summary.txt"
if (Test-Path $summaryFile) {
    Write-Host "  ✅ Summary file exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Summary file missing" -ForegroundColor Yellow
}

# NetLog SSE sayısı kontrolü (hızlı sinyal - opsiyonel)
if ($netlogFiles) {
    Write-Host "`n[CHECK] NetLog SSE Count (Quick Signal)..." -ForegroundColor Yellow
    try {
        $netlogFile = $netlogFiles[0].FullName
        $netlogContent = Get-Content $netlogFile -Raw
        $sseMatches = ([regex]::Matches($netlogContent, "/api/copilot/chat")).Count
        Write-Host "  NetLog '/api/copilot/chat' occurrences: $sseMatches" -ForegroundColor Gray
        Write-Host "  Note: NetLog satır sayısı ≠ request sayısı (multiple lines per request normal)" -ForegroundColor Gray
        Write-Host "  Expected: ~10-50 occurrences for 3 tests (rough estimate)" -ForegroundColor Gray
        if ($sseMatches -lt 5) {
            Write-Host "  ⚠️  Very low count - possible incomplete capture" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️  Could not analyze NetLog" -ForegroundColor Yellow
    }
}

# PASS/FAIL Tutarlılık Kontrolü
Write-Host "`n[CHECK] Test Results Consistency..." -ForegroundColor Yellow
$passCount = ($testResults.Values | Where-Object { $_ -eq "PASS" }).Count
$failCount = ($testResults.Values | Where-Object { $_ -eq "FAIL" }).Count
$unknownCount = ($testResults.Values | Where-Object { $_ -eq "UNKNOWN" }).Count

Write-Host "  T1: $($testResults['T1'])" -ForegroundColor $(if ($testResults['T1'] -eq "PASS") { "Green" } elseif ($testResults['T1'] -eq "FAIL") { "Red" } else { "Yellow" })
Write-Host "  T2: $($testResults['T2'])" -ForegroundColor $(if ($testResults['T2'] -eq "PASS") { "Green" } elseif ($testResults['T2'] -eq "FAIL") { "Red" } else { "Yellow" })
Write-Host "  T3: $($testResults['T3'])" -ForegroundColor $(if ($testResults['T3'] -eq "PASS") { "Green" } elseif ($testResults['T3'] -eq "FAIL") { "Red" } else { "Yellow" })

# Summary dosyası güncelleme önerisi
$summaryFile = "$evidenceDir\gateC_smoke_test_summary.txt"
if (Test-Path $summaryFile) {
    Write-Host "`n[CHECK] Summary File..." -ForegroundColor Yellow
    Write-Host "  ✅ Summary file exists" -ForegroundColor Green
    Write-Host "  Note: Update summary with final status after verification" -ForegroundColor Gray
} else {
    Write-Host "`n[CHECK] Summary File..." -ForegroundColor Yellow
    Write-Host "  ⚠️  Summary file missing" -ForegroundColor Yellow
}

# Sonuç ve Hızlı Teşhis
Write-Host "`n=== Gate C PASS Status ===" -ForegroundColor Cyan

if ($allPass -and $passCount -eq 3 -and $failCount -eq 0) {
    Write-Host "✅ Gate C PASS - All checks passed!" -ForegroundColor Green
    Write-Host "`nNext Step: Gate D (metrikler + prod debugability)" -ForegroundColor Yellow
    Write-Host "  - stream_open_total / stream_abort_total" -ForegroundColor Gray
    Write-Host "  - invalid_event_dropped_total / active_streams_gauge" -ForegroundColor Gray
    Write-Host "  - Grafana panel: 'akıyor mu?' sorusu tek bakışta" -ForegroundColor Gray
} else {
    Write-Host "❌ Gate C FAIL - Some checks failed" -ForegroundColor Red

    # Hızlı teşhis
    Write-Host "`n[QUICK DIAGNOSIS]..." -ForegroundColor Yellow
    if ($testResults['T1'] -eq "FAIL") {
        Write-Host "  T1 FAIL: Usually 'second panel opens second stream'" -ForegroundColor Red
        Write-Host "    → Check: session manager singleton / subscription lifecycle leak" -ForegroundColor Gray
    }
    if ($testResults['T2'] -eq "FAIL") {
        Write-Host "  T2 FAIL: Abort caught but 'error envelope' emitted" -ForegroundColor Red
        Write-Host "    → Check: AbortError branch in error handling" -ForegroundColor Gray
    }
    if ($testResults['T3'] -eq "FAIL") {
        Write-Host "  T3 FAIL: liveMaxDurationMs override exists in UI but not wired to hook" -ForegroundColor Red
        Write-Host "    → Check: param wiring in useLiveSession hook" -ForegroundColor Gray
    }

    Write-Host "`nReview missing artifacts/evidence and re-run tests" -ForegroundColor Yellow
}


