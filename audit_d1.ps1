$ErrorActionPreference = 'SilentlyContinue'
Set-Location 'C:\dev'

# 1) Dosya listesi
$files = @(
  'docs\SPARK_ALL_IN_ONE.md',
  'README.md',
  'apps\web-next\.env.example',
  'apps\web-next\src\providers\MarketProvider.tsx',
  'apps\web-next\src\lib\ws\rafBatch.ts',
  'apps\web-next\src\lib\ws\binance.ts',
  'apps\web-next\src\lib\ws\btcturk.mock.ts',
  'apps\web-next\src\stores\marketStore.ts',
  'apps\web-next\src\components\market\MarketCard.tsx',
  'apps\web-next\src\types\backtest.ts',
  'apps\web-next\src\components\lab\LabToolbar.tsx',
  'apps\web-next\src\components\lab\ResultPanel.tsx',
  'apps\web-next\src\lib\api\exec.ts',
  'apps\web-next\src\lib\metrics.ts',
  'apps\web-next\src\app\observability\page.tsx',
  'apps\web-next\src\app\(dashboard)\page.tsx',
  'apps\web-next\src\app\strategy-lab\page.tsx'
)

# 2) Varlık kontrolü
$hit=0; $miss=0; $missing=@()
foreach($f in $files){
  if(Test-Path $f){ $hit++ } else { $miss++; $missing += $f; Write-Output ("MISSING: {0}" -f $f) }
}

# 3) README linki
$readmeOk = $false
if (Test-Path 'README.md') { $readmeOk = Select-String -Path 'README.md' -SimpleMatch 'docs/SPARK_ALL_IN_ONE.md' -Quiet }
if(-not $readmeOk){ Write-Output 'README link eksik: docs/SPARK_ALL_IN_ONE.md' }

# 4) .env.example anahtarları
$keys = @('EXECUTOR_BASE','NEXT_PUBLIC_EXECUTOR_BASE','NEXT_PUBLIC_WS_BINANCE','NEXT_PUBLIC_WS_BTCTURK')
$envCount = 0
if (Test-Path 'apps\web-next\.env.example') {
  foreach($k in $keys){ if(Select-String -Path 'apps\web-next\.env.example' -SimpleMatch $k -Quiet){ $envCount++ } else { Write-Output ("ENV eksik: {0}" -f $k) } }
}
$envOk = ($envCount -eq $keys.Count)

# 5) Son commit başlığı
$lastCommit = 'NO_COMMIT'
try { $lastCommit = (git log -1 --pretty=%s 2>$null) } catch {}
if([string]::IsNullOrWhiteSpace($lastCommit)){ $lastCommit = 'NO_COMMIT' }

# 6) TEK SATIR ÖZET (concat, kaçışsız)
$summary = 'SUMMARY D1-AUDIT: files=' + $hit + '/16 ok, missing=' + $miss + '; readme=' + ([int]$readmeOk) + '; env=' + ([int]$envOk) + '; last_commit="' + $lastCommit + '"'
Write-Output $summary


