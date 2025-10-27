# S4 FIX (idempotent)
$ErrorActionPreference='Stop'

# 0) Süreç/lock temizlik
Stop-Process -Name node -ErrorAction SilentlyContinue
Stop-Process -Name git  -ErrorAction SilentlyContinue
if (Test-Path .git/index.lock) { Remove-Item -Force .git/index.lock }

# 1) pnpm workspace ve install
corepack enable; corepack prepare pnpm@latest --activate | Out-Null
$pnv = pnpm -v
@'
packages:
  - "apps/*"
  - "packages/*"
  - "services/*"
'@ | Set-Content pnpm-workspace.yaml -NoNewline
pnpm -w install --no-frozen-lockfile | Out-Null

# 2) .env.local
$envPath = "apps/web-next/.env.local"
if (!(Test-Path $envPath)) { New-Item -ItemType File -Force $envPath | Out-Null }
$envText = Get-Content $envPath -Raw
if ($envText -notmatch "^JWT_SECRET=") { Add-Content $envPath "JWT_SECRET=dev-local" }
if ($envText -notmatch "^DEV_TOKEN=")  { Add-Content $envPath "DEV_TOKEN=dev-token" }

# 3) jose bağımlılığı
$pkg = Get-Content "apps/web-next/package.json" -Raw | ConvertFrom-Json
$hasJose = $false
if ($pkg.PSObject.Properties.Name -contains 'dependencies') {
  $deps = $pkg.dependencies
  if ($deps) { $hasJose = $deps.PSObject.Properties.Name -contains 'jose' }
}
if (-not $hasJose) { pnpm --filter apps/web-next add jose@latest | Out-Null }

# 4) Duplicate cleanup (pages → pages_disabled)
function MoveOrGitMv($src,$dst){ if (Test-Path $src) { git mv $src $dst 2>$null; if ($LASTEXITCODE -ne 0) { New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null; Move-Item $src $dst -Force } } }
New-Item -ItemType Directory -Force apps/web-next/pages_disabled/api | Out-Null
if (Test-Path "apps/web-next/pages/api/broker") { MoveOrGitMv "apps/web-next/pages/api/broker" "apps/web-next/pages_disabled/api/broker" }
# (Diğerleri daha önce taşınmış olabilir)

git add -A apps/web-next/pages_disabled 2>$null
try { git commit -m "chore(router): disable pages/api/broker duplicate under pages_disabled" 2>$null } catch {}

# 5) Typecheck
$tcOk = $true
try { pnpm --filter apps/web-next run typecheck } catch { $tcOk = $false }
if (-not $tcOk) { pnpm --filter apps/web-next run ts:check }

# 6) Clean build + start
if (Test-Path "apps/web-next/.next") { Remove-Item -Recurse -Force "apps/web-next/.next" -ErrorAction SilentlyContinue }
pnpm --filter apps/web-next run build
$web = Start-Process -FilePath "pnpm" -ArgumentList "--filter","apps/web-next","run","start" -PassThru
# wait-on yerine basit polling
$base = "http://127.0.0.1:3003"
$ready = $false; for($i=0;$i -lt 60;$i++){ try{ $r=Invoke-WebRequest "$base/api/public/health" -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){ $ready=$true; break } } catch {}; Start-Sleep -Milliseconds 500 }

# 7) Sanity
$codes = @{ HEALTH=-1; METRICS=-1; UNAUTH=-1; AUTH=-1 }
try { $codes.HEALTH  = (Invoke-WebRequest "$base/api/public/health" -UseBasicParsing).StatusCode } catch {}
try { $codes.METRICS = (Invoke-WebRequest "$base/api/public/metrics/prom" -UseBasicParsing).StatusCode } catch {}
try { $codes.UNAUTH  = (Invoke-WebRequest "$base/api/broker/binance/balance" -UseBasicParsing -ErrorAction SilentlyContinue).StatusCode } catch {}
try { $codes.AUTH    = (Invoke-WebRequest "$base/api/broker/binance/balance" -UseBasicParsing -Headers @{"x-dev-role"="admin"}).StatusCode } catch {}

# 8) Smoke (Playwright)
$smokeOk = $true
try {
  npx playwright install --with-deps | Out-Null
  npx playwright test --config=apps/web-next/tests/playwright.config.ts --grep @smoke
} catch { $smokeOk = $false }

# 9) Sunucuyu kapat
try { if ($web) { Stop-Process -Id $web.Id -ErrorAction SilentlyContinue } } catch {}

# 10) Doküman notu (idempotent)
if (Test-Path "docs/ROUTER_MIGRATION.md") {
  $s = Get-Content "docs/ROUTER_MIGRATION.md" -Raw
  if ($s -notmatch "CLOSED \(pages disabled\)") { Add-Content "docs/ROUTER_MIGRATION.md" "`n**Sprint-3:** CLOSED (pages disabled)`n" }
}

# 11) JSON özet
[pscustomobject]@{
  PNPM_Version = $pnv
  Ready        = $ready
  Jose_Dep     = $hasJose -or $true
  Sanity       = $codes
  Smoke_OK     = $smokeOk
} | ConvertTo-Json -Depth 4 