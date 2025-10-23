param(
  [string]$Repo = "mgymgy7878/CursorGPT_IDE",
  [string]$Workflow = "p0-chain.yml",
  [string]$ArtifactName = "p0-artifacts",
  [switch]$NoPause
)

# 0) GH CLI var mı?
& gh --version 1>$null 2>$null
if ($LASTEXITCODE -ne 0) { Write-Error "GitHub CLI (gh) bulunamadı. Kurulum: https://cli.github.com/manual/gh"; exit 1 }

# 1) GH oturum (PS5.1: '||' yok, $LASTEXITCODE ile kontrol)
& gh auth status 1>$null 2>$null
if ($LASTEXITCODE -ne 0) { gh auth login }

# 2) Workflow'u tetikle (workflow_dispatch)
Write-Host "[INFO] Tetikleniyor: $Workflow @ $Repo"
$null = gh workflow run $Workflow -R $Repo
if ($LASTEXITCODE -ne 0) { Write-Error "Workflow tetikleme başarısız"; exit 2 }

# 3) Run ID gelene dek kısa bekleme döngüsü (max ~24 sn)
$run = $null
for ($i=0; $i -lt 12 -and -not $run; $i++) {
  Start-Sleep -Seconds 2
  $run = gh run list -R $Repo --workflow $Workflow --limit 1 --json databaseId -q '.[0].databaseId'
}
if (-not $run) { Write-Error "Run bulunamadı"; exit 3 }
Write-Host "[INFO] Run: $run"

# 4) Run'ı tamamlanana dek izle (compact)
$null = gh run watch $run -R $Repo --compact
if ($LASTEXITCODE -ne 0) { Write-Error "Run izleme başarısız"; exit 4 }

# 5) Artifact indir
New-Item -ItemType Directory -Force -Path evidence | Out-Null
$null = gh run download $run -R $Repo -n $ArtifactName -D evidence
if ($LASTEXITCODE -ne 0) { Write-Error "Artifact indirme başarısız"; exit 5 }

# 6) FINAL SUMMARY (tek satır)
if (Test-Path evidence/final_summary.txt) {
  $final = Get-Content evidence/final_summary.txt | Select-Object -First 1
  Write-Host $final
} else {
  Write-Warning "final_summary.txt bulunamadı; workflow içeriğini kontrol ediniz."
}

# 7) İsteğe bağlı toplam byte
try { (Get-ChildItem -Recurse evidence | Measure-Object -Sum Length).Sum | Out-Null } catch {}

if (-not $NoPause) { Read-Host "Bitti. Kapatmak için Enter'a basın" }



