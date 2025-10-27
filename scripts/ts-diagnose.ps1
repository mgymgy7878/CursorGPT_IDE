$ErrorActionPreference = 'Continue'
$ev = "evidence\local"; New-Item -ItemType Directory -Force $ev | Out-Null
# Eski tsbuildinfo’ları temizle
Get-ChildItem -Recurse -Filter *.tsbuildinfo -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
# Referans dosyası
$ref = "tsconfig.references.core.json"; if (-not (Test-Path $ref)) { $ref = "tsconfig.json" }
# Log yolları
$log = Join-Path $ev "tsc_core.log"
$head = Join-Path $ev "tsc_core_head.txt"
$first = Join-Path $ev "tsc_core_first.txt"
# Workspace tsc ile çalıştır
pnpm tsc -b $ref --pretty false 2>&1 | Tee-Object -FilePath $log | Select-Object -First 120 | Out-File -Encoding UTF8 $head
$line = Select-String -Path $log -Pattern ":\d+:\d+ - error TS\d+:" | Select-Object -First 1
if ($null -ne $line) { $line.ToString() | Out-File -Encoding UTF8 $first; exit 1 } else { "NO_TS_ERROR" | Out-File -Encoding UTF8 $first; exit 0 }
$ErrorActionPreference = 'Continue'
Write-Host "=== TS Diagnose (core) ==="

# Evidence klasörü
$ev = "evidence\local"
New-Item -ItemType Directory -Force $ev | Out-Null

# Eski tsbuildinfo temizliği (referans grafiği)
Get-ChildItem -Path . -Recurse -Filter *.tsbuildinfo -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Referans dosyası sezgisel seçim
$ref = "tsconfig.references.core.json"
if (-not (Test-Path $ref)) { $ref = "tsconfig.json" }

# Çalıştır ve logla
$log = Join-Path $ev "tsc_core.log"
$head = Join-Path $ev "tsc_core_head.txt"
$first = Join-Path $ev "tsc_core_first.txt"

tsc -b $ref --pretty false 2>&1 | Tee-Object -FilePath $log | Select-Object -First 120 | Out-File -Encoding UTF8 $head

# İlk hata satırını yakala:  file(path)(line,col): error TSxxxx:
$line = Select-String -Path $log -Pattern "\(\d+,\d+\): error TS\d+:" | Select-Object -First 1
if ($null -ne $line) {
    $line.ToString() | Out-File -Encoding UTF8 $first
    exit 1
}
else {
    "NO_TS_ERROR" | Out-File -Encoding UTF8 $first
    exit 0
}


