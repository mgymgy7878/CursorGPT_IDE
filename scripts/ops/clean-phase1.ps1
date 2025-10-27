# --- Spark Cleanup Phase-1 (safe-first) ---
$ErrorActionPreference = "Stop"
Set-Location "C:\dev\CursorGPT_IDE"
$ts = Get-Date -Format "yyyyMMdd_HHmmss"

# 0) Tüm repo için tam yedek (kaba ama güvenli)
$fullBackup = "C:\dev\CursorGPT_IDE_BACKUP_BEFORE_CLEANUP_$ts"
Copy-Item -Path "C:\dev\CursorGPT_IDE" -Destination $fullBackup -Recurse

# 1) Çakışan iç klasörü güvenli alana taşı
$legacy = "_backups\legacy_inner_$ts"
New-Item -ItemType Directory -Path $legacy -Force | Out-Null
if (Test-Path ".\CursorGPT_IDE") {
  Move-Item -Path ".\CursorGPT_IDE" -Destination $legacy
}

# 2) Dokümantasyon arşivi
New-Item -ItemType Directory -Path "docs\archive" -Force | Out-Null
Get-ChildItem -Path . -Filter "GREEN_EVIDENCE_*.md"      | Move-Item -Destination "docs\archive" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "V1_*.md"                   | Move-Item -Destination "docs\archive" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "SESSION_SUMMARY_*.md"      | Move-Item -Destination "docs\archive" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "DETAYLI_PROJE_ANALIZ_*.md" | Move-Item -Destination "docs\archive" -Force -ErrorAction SilentlyContinue

# 3) Eski backup'ı temizle (örnek: 20251002_010723)
$old = "_backups\backup_20251002_010723"
if (Test-Path $old) { Remove-Item -Recurse -Force $old }

# 4) Milestone backup'ları zip'le
Get-ChildItem -Path "_backups" -Directory -Filter "backup_v1.4_*" | ForEach-Object {
  $zip = "$($_.FullName)_$ts.zip"
  Compress-Archive -Path $_.FullName -DestinationPath $zip -Force
  Remove-Item -Recurse -Force $_.FullName
}

# 5) node_modules temizle → yeniden kur
Get-ChildItem -Directory -Recurse -Filter "node_modules" | Remove-Item -Recurse -Force
pnpm install

# 6) Kanıt çıktıları
"--- CLEAN PHASE-1 EVIDENCE ---"
"Full backup      : $fullBackup"
"Legacy moved to  : $legacy"
"Archive count    : " + (Get-ChildItem "docs\archive" -File | Measure-Object).Count
"Total files now  : " + (Get-ChildItem -Recurse -File | Measure-Object).Count

