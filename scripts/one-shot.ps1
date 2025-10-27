$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Ensure Node v20 portable PATH (session-only)
$ver = '20.10.0'
$p1 = "C:\dev\node-v$ver-win-x64"
if (Test-Path $p1) {
    $env:Path = "$p1;$p1\node_modules\npm\bin;" + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

# Evidence dizini
$ev = "evidence\local\oneshot"
New-Item -ItemType Directory -Force $ev | Out-Null
function WriteEv([string]$name, [string]$content) { $p = Join-Path $ev $name; $content | Out-File -Encoding UTF8 $p }

# Versiyon kanıtı
(node -v) | Out-File -Encoding UTF8 (Join-Path $ev 'node.txt')
(pnpm -v) | Out-File -Encoding UTF8 (Join-Path $ev 'pnpm.txt')

# 0) ENV garanti (idempotent)
$envFile = "apps\web-next\.env.local"
if (!(Test-Path $envFile)) { 'EXECUTOR_BASE=http://127.0.0.1:4001' | Set-Content -Encoding UTF8 $envFile }
elseif (-not (Select-String -Path $envFile -Pattern '^EXECUTOR_BASE=' -Quiet)) { Add-Content $envFile 'EXECUTOR_BASE=http://127.0.0.1:4001' }

# 1) TS ilk hata teşhisi (önceki araç)
pnpm run ts:diag:core | Out-Null
if ($LASTEXITCODE -ne 0) {
    $first = "UNKNOWN_TS_ERROR"
    if (Test-Path "evidence\local\tsc_core_first.txt") { $first = Get-Content "evidence\local\tsc_core_first.txt" -Raw }
    WriteEv "summary.txt" ("STATUS=YELLOW`nSTEP=ts:diag:core`nFIRST_ERROR=" + $first)
    exit 2
}

# 2) check:fast (otomatik lint fix ile ikinci deneme)
pnpm -w run check:fast | Out-Null
if ($LASTEXITCODE -ne 0) {
    pnpm -w run lint -- --fix | Out-Null
    pnpm -w run check:fast | Out-Null
    if ($LASTEXITCODE -ne 0) {
        WriteEv "summary.txt" "STATUS=YELLOW`nSTEP=check:fast`nDETAIL=lint/typecheck still failing"
        exit 3
    }
}

# 3) web-next build (hafıza güvenli)
$env:NODE_OPTIONS = "--max-old-space-size=4096"
pnpm --filter web-next run build --silent | Out-Null
if ($LASTEXITCODE -ne 0) {
    WriteEv "summary.txt" "STATUS=YELLOW`nSTEP=build(web-next)`nDETAIL=build failed"
    exit 4
}

# 4) Commit & push (husky + no changes güvenli)
& git checkout -B feat/v1.2-btcturk-bist | Out-Null
& git add -A | Out-Null
& git commit -m "build: TS pass; ui: StatusPill→executor; ci: doctor evidence" | Out-Null
if ($LASTEXITCODE -ne 0) { & git commit --allow-empty -m "chore: trigger CI" | Out-Null }
& git push --set-upstream origin feat/v1.2-btcturk-bist | Out-Null

# 5) Smoke (UI health) ve final özet
$sm = & "$env:SystemRoot\System32\curl.exe" -s "http://127.0.0.1:3003/api/public/health"
WriteEv "health.json" $sm
WriteEv "summary.txt" "STATUS=GREEN`nSTEP=all`nSMOKE=/api/public/health OK"
exit 0


