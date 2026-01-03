# Evidence Index Generator
# evidence/ klasöründeki kanıt paketlerini index'ler
# Hafızayı insandan alıp repoya ver

param(
  [string]$OutputFile = "evidence/INDEX.md"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# UTF-8 encoding guard
try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
  $OutputEncoding = [Console]::OutputEncoding
} catch {}

# Evidence klasörü yoksa oluştur
if (-not (Test-Path "evidence")) {
  New-Item -ItemType Directory -Force -Path "evidence" | Out-Null
}

$indexContent = "# Evidence Index`n`n"
$indexContent += "**Son Guncelleme:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
$indexContent += "Bu dosya, evidence klasorundeki kanit paketlerinin otomatik index'idir.`n"
$indexContent += "Hafizayi insandan alip repoya ver.`n`n"
$indexContent += "---`n`n"
$indexContent += "## Pozitif Kanit Paketleri`n`n"

# Pozitif paketler (final_verification_*)
$positiveDirs = @(Get-ChildItem evidence -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^final_verification_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}$' } | Sort-Object LastWriteTime -Descending)
if ($positiveDirs.Length -gt 0) {
  $indexContent += "**En Son:** ``$($positiveDirs[0].Name)``\n`n"
  foreach ($dir in $positiveDirs) {
    $files = @(Get-ChildItem $dir.FullName -File -Recurse -ErrorAction SilentlyContinue)
    $fileCount = $files.Length
    $indexContent += "- ``$($dir.Name)`` - $($dir.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) ($fileCount dosya)`n"
  }
} else {
  $indexContent += "*Henuz pozitif kanit paketi yok.*`n"
}

$indexContent += "`n---`n`n"
$indexContent += "## Negatif Kanit Paketleri`n`n"

# Negatif paketler (negative_tests_*)
$negativeDirs = @(Get-ChildItem evidence -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^negative_tests_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}$' } | Sort-Object LastWriteTime -Descending)
if ($negativeDirs.Length -gt 0) {
  $indexContent += "**En Son:** ``$($negativeDirs[0].Name)``\n`n"
  foreach ($dir in $negativeDirs) {
    $files = @(Get-ChildItem $dir.FullName -File -Recurse -ErrorAction SilentlyContinue)
    $fileCount = $files.Length
    $indexContent += "- ``$($dir.Name)`` - $($dir.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) ($fileCount dosya)`n"
  }
} else {
  $indexContent += "*Henuz negatif kanit paketi yok.*`n"
}

$indexContent += "`n---`n`n"
$indexContent += "## Backtest Kanit Paketleri`n`n"

# Backtest paketler (backtest_*)
$backtestDirs = @(Get-ChildItem evidence -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^backtest_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}$' } | Sort-Object LastWriteTime -Descending)
if ($backtestDirs.Length -gt 0) {
  $indexContent += "**En Son:** ``$($backtestDirs[0].Name)``\n`n"
  foreach ($dir in $backtestDirs) {
    $files = @(Get-ChildItem $dir.FullName -File -Recurse -ErrorAction SilentlyContinue)
    $fileCount = $files.Length
    $indexContent += "- ``$($dir.Name)`` - $($dir.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) ($fileCount dosya)`n"
  }
} else {
  $indexContent += "*Henuz backtest kanit paketi yok.*`n"
}

$indexContent += "`n---`n`n"
$indexContent += "## AU SHA512 Dogrulama Paketleri`n`n"

# AU SHA512 verify dosyaları
$auFiles = @(Get-ChildItem evidence -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^au_sha512_verify_.*\.json$' } | Sort-Object LastWriteTime -Descending)
if ($auFiles.Length -gt 0) {
  $indexContent += "**En Son:** ``$($auFiles[0].Name)``\n`n"
  foreach ($file in $auFiles) {
    try {
      $json = Get-Content $file.FullName -Raw | ConvertFrom-Json
      $matchStatus = if ($json.match) { "[OK] Match" } else { "[FAIL] Mismatch" }
      $indexContent += "- ``$($file.Name)`` - $($file.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) - $matchStatus`n"
    } catch {
      $indexContent += "- ``$($file.Name)`` - $($file.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))`n"
    }
  }
} else {
  $indexContent += "*Henuz AU SHA512 dogrulama paketi yok.*`n"
}

$indexContent += "`n---`n`n"
$indexContent += "## Index Guncelleme`n`n"
$indexContent += "Bu index otomatik olarak guncellenir:`n`n"
$indexContent += "```powershell`n"
$indexContent += "pnpm evidence:index`n"
$indexContent += "````n`n"
$indexContent += "**Not:** Index, evidence klasorundeki mevcut paketleri tarar ve listeler.`n"
$indexContent += "Yeni paketler eklendiginde index'i yeniden olusturun.`n`n"
$indexContent += "---`n`n"
$indexContent += "*Son guncelleme: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')*`n"

# Index dosyasını yaz
$indexContent | Out-File -FilePath $OutputFile -Encoding utf8 -NoNewline

Write-Host "[OK] Evidence index oluşturuldu: $OutputFile" -ForegroundColor Green

