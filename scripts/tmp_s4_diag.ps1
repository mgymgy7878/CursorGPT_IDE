# === S4 RESTART + DIAG ===
# Süreç/lock temizliği
Stop-Process -Name node -ErrorAction SilentlyContinue
Stop-Process -Name git  -ErrorAction SilentlyContinue
if (Test-Path .git/index.lock) { Remove-Item -Force .git/index.lock }

# pnpm workspace doğrula (idempotent)
corepack enable; corepack prepare pnpm@latest --activate | Out-Null
pnpm -v
@'
packages:
  - "apps/*"
  - "packages/*"
  - "services/*"
'@ | Set-Content pnpm-workspace.yaml -NoNewline
pnpm -w install --no-frozen-lockfile

# .env.local kontrol (var mı / anahtarlar var mı?)
$envPath = "apps/web-next/.env.local"
$hasEnv = Test-Path $envPath
$envJwt = $false; $envDev = $false
if ($hasEnv) {
  $t = Get-Content $envPath -Raw
  $envJwt = $t -match "^JWT_SECRET="
  $envDev = $t -match "^DEV_TOKEN="
}

# jose çözümü (package ve lock)
$pkg = Get-Content "apps/web-next/package.json" -Raw | ConvertFrom-Json
$hasJoseDep = $pkg.dependencies.PSObject.Properties.Name -contains "jose"
$joseList = (pnpm list jose -r --depth 0) 2>$null

# duplicate’lar (pages vs pages_disabled)
$pagesDup = @(
  "api/logs/sse.ts","api/strategy","api/broker","strategy","supervisor"
) | ForEach-Object {
  $p="apps/web-next/pages/$_"; if (Test-Path $p) { $_ }
}

# router envanteri (varsa script’le raporla)
if (Test-Path "scripts/routes_inventory.ps1") {
  & "scripts/routes_inventory.ps1" | Out-Host
}

# Özet tablo
[pscustomobject]@{
  ENV_File_Exists = $hasEnv
  ENV_JWT_SECRET  = $envJwt
  ENV_DEV_TOKEN   = $envDev
  Jose_Dependency = $hasJoseDep
  Jose_Installed  = ($joseList -match "jose@" | Measure-Object).Count -gt 0
  Pages_Duplicates= ($pagesDup -join ", ")
} | Format-List
# === /DIAG === 