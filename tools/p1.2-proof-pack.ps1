# tools/p1.2-proof-pack.ps1
# Proof Pack Runner: Tek komut, kanıt üretir
# PS5.1 uyumlu; rg yoksa Select-String ile çalışır

$ErrorActionPreference = "Continue"

$root = Resolve-Path "."
$ev = Join-Path $root "evidence/p1.2-live"
New-Item -ItemType Directory -Force -Path $ev | Out-Null

$hasFail = $false

# Gate fazlandırması: GateA/B sadece core, GateC +live-react, GateD +UI guard
$gate = $env:GATE_NAME
if ([string]::IsNullOrWhiteSpace($gate)) { $gate = "GateD" }

$rankMap = @{ GateA = 1; GateB = 2; GateC = 3; GateD = 4 }
$rank = $rankMap[$gate]
if (-not $rank) { $rank = 4 }

$strictUi = ($rank -ge 4)          # sadece GateD
$expectLiveReact = ($rank -ge 3)   # GateC ve GateD

Write-Host "Gate: $gate (rank=$rank, strictUi=$strictUi, expectLiveReact=$expectLiveReact)"

function Run-Cmd($cmd, $outFile) {
  Write-Host "==> $cmd"
  $outPath = Join-Path $ev $outFile
  # PowerShell bazen pipeline'da exit code'u yutabilir; garanti altına al
  $result = cmd /c "$cmd" 2>&1 | Tee-Object -FilePath $outPath
  if ($LASTEXITCODE -ne 0) {
    $script:hasFail = $true
    Write-Host "FAIL: Exit code $LASTEXITCODE"
  }
  return $result
}

# 0) Ortam + commit kanıtı (audit altın madalyası)
$envOut = Join-Path $ev "env.txt"
"ENVIRONMENT + COMMIT EVIDENCE" | Out-File $envOut
"`n--- Node Version ---" | Out-File $envOut -Append
Run-Cmd "node -v" "env_node.txt" | Out-File $envOut -Append
"`n--- pnpm Version ---" | Out-File $envOut -Append
Run-Cmd "pnpm -v" "env_pnpm.txt" | Out-File $envOut -Append

$gitOut = Join-Path $ev "git.txt"
"GIT COMMIT + STATUS" | Out-File $gitOut
"`n--- Commit Hash ---" | Out-File $gitOut -Append
$commitHash = Run-Cmd "git rev-parse HEAD" "git_hash.txt"
$commitHash | Out-File $gitOut -Append
"`n--- Git Status ---" | Out-File $gitOut -Append
Run-Cmd "git status --porcelain" "git_status.txt" | Out-File $gitOut -Append

# 1) UI parsing guard (sadece GateD)
$grepOut = Join-Path $ev "grep_ui_parsing.txt"

if ($strictUi) {
  "UI RAW PARSING GUARD (exclude: packages/live-*, *.md, *.test.*, __tests__)" | Out-File $grepOut

  # Regex pattern'ler (SimpleMatch değil, regex kullan)
  # React'ta SSE parsing bazen ReadableStreamDefaultReader/TextDecoder ile gizleniyor
  $patterns = @(
    "getReader\(",
    "\bEventSource\b",
    "new\s+WebSocket",
    "data:\s",
    "response\.body\.getReader"  # ReadableStream parsing kokusu
  )
  $searchRoots = @("apps/web-next/src/components", "apps/web-next/src/app")

  foreach ($p in $patterns) {
    "`n--- PATTERN: $p ---" | Out-File $grepOut -Append

    $hits = Get-ChildItem -Path $searchRoots -Recurse -File -Include *.ts,*.tsx `
      | Where-Object { $_.FullName -notmatch "\\packages\\live-" } `
      | Where-Object { $_.FullName -notmatch "\.md$" } `
      | Where-Object { $_.FullName -notmatch "\.test\." } `
      | Where-Object { $_.FullName -notmatch "\\__tests__\\" } `
      | Select-String -Pattern $p -ErrorAction SilentlyContinue

    if ($hits) {
      "FAIL: Found matches" | Out-File $grepOut -Append
      $hits | ForEach-Object { "$($_.Path):$($_.LineNumber) $($_.Line.Trim())" } | Out-File $grepOut -Append
      $hasFail = $true
    } else {
      "PASS: No matches" | Out-File $grepOut -Append
    }
  }

  # 1b) StatusBar kuralları (UI canlılık tarafındaki en büyük "kaza" sınıfı)
  # StatusBar bazen StatusBar.tsx değil TopStatusBar.tsx gibi ayrılıyor; glob ile tara
  "`n--- STATUSBAR RULES ---" | Out-File $grepOut -Append

  $statusBarFiles = Get-ChildItem -Path "apps/web-next/src/components" -Recurse -File -Include *StatusBar*.tsx -ErrorAction SilentlyContinue

  if ($statusBarFiles) {
    foreach ($sbFile in $statusBarFiles) {
      "`nChecking: $($sbFile.FullName)" | Out-File $grepOut -Append
      $sbText = Get-Content $sbFile.FullName -Raw

      if ($sbText -match "useCopilotChat") {
        "FAIL: $($sbFile.Name) imports/mentions useCopilotChat" | Out-File $grepOut -Append
        $hasFail = $true
      } else {
        "PASS: $($sbFile.Name) does not mention useCopilotChat" | Out-File $grepOut -Append
      }

      if ($sbText -match '"use client"' -or $sbText -match "'use client'") {
        "PASS: $($sbFile.Name) has use client" | Out-File $grepOut -Append
      } else {
        "FAIL: $($sbFile.Name) missing use client" | Out-File $grepOut -Append
        $hasFail = $true
      }
    }
  } else {
    "WARN: No StatusBar*.tsx files found in apps/web-next/src/components" | Out-File $grepOut -Append
  }
} else {
  "SKIP: UI guard + StatusBar rules (Gate=$gate, strictUi=false)" | Out-File $grepOut
}

# 2) Typecheck + Jest logs (workspace)
Run-Cmd "pnpm -w typecheck" "typecheck.txt"

# Jest'i "flaky'i yakalayan" modda çalıştır (--runInBand Windows + IO'da stabiliteyi artırır)
Run-Cmd "pnpm --filter @spark/live-core test -- --runInBand" "jest_live_core.txt"

# live-react testi sadece GateC ve GateD'de
if ($expectLiveReact) {
  if (-not (Test-Path "packages/live-react")) {
    $hasFail = $true
    "FAIL: Gate requires packages/live-react but folder missing" | Out-File (Join-Path $ev "jest_live_react.txt")
  } else {
    Run-Cmd "pnpm --filter @spark/live-react test -- --runInBand" "jest_live_react.txt"
  }
} else {
  "SKIP: live-react tests (Gate=$gate, expectLiveReact=false)" | Out-File (Join-Path $ev "jest_live_react.txt")
}

# 3) Metrics snapshot (sadece GateD, opsiyonel: endpoint ayaktaysa)
# Not: URL'i projene göre gerekirse güncelle (web-next dev: http://localhost:3003/api/public/metrics)
$metricsOut = Join-Path $ev "60s_stress_metrics.txt"
if ($strictUi) {
  $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
  $url = "http://localhost:3003/api/public/metrics"
  "METRICS SNAPSHOT (best-effort)" | Out-File $metricsOut
  "Timestamp: $timestamp" | Out-File $metricsOut -Append
  "URL: $url" | Out-File $metricsOut -Append
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 8
    "HTTP Status: $($response.StatusCode)" | Out-File $metricsOut -Append
    "" | Out-File $metricsOut -Append
    $response.Content | Out-File $metricsOut -Append
  } catch {
    "HTTP Status: ERROR" | Out-File $metricsOut -Append
    "SKIP: metrics endpoint not reachable: $($_.Exception.Message)" | Out-File $metricsOut -Append
  }
} else {
  "SKIP: metrics snapshot (Gate=$gate, strictUi=false)" | Out-File $metricsOut
}

# 4) Proof summary (PASS/FAIL + gate adı + commit hash) - Makine okunabilir format
$summaryOut = Join-Path $ev "proof_summary.txt"
$gateName = $env:GATE_NAME
if (-not $gateName) {
  $gateName = "UNKNOWN"
}

$status = if ($hasFail) { "FAIL" } else { "PASS" }
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$commitHashTrimmed = $commitHash.Trim()
$exitCode = if ($hasFail) { 1 } else { 0 }

# Makine okunabilir format (tek satır + key=value)
"RESULT=$status GATE=$gateName COMMIT=$commitHashTrimmed TIME=$timestamp EXIT=$exitCode" | Out-File $summaryOut

# İnsan okunabilir format (opsiyonel, aynı dosyaya append)
@"

PROOF PACK SUMMARY
==================
Gate: $gateName
Status: $status
Commit: $commitHashTrimmed
Timestamp: $timestamp
Exit Code: $exitCode
"@ | Out-File $summaryOut -Append

Write-Host "`nProof Pack ready: $ev"
Write-Host "Status: $status"
Write-Host "Summary: $summaryOut"

# CI/gate için exit code
if ($hasFail) {
  exit 1
} else {
  exit 0
}

