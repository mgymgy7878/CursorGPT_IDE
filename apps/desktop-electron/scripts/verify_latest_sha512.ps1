param(
  [Parameter(Mandatory=$true)][string]$Exe,
  [Parameter(Mandatory=$true)][string]$LatestYml
)
if (!(Test-Path $Exe)) { Write-Error "EXE not found: $Exe"; exit 2 }
if (!(Test-Path $LatestYml)) { Write-Error "latest.yml not found: $LatestYml"; exit 2 }

# Read expected base64 sha512 from latest.yml (first sha512 occurrence)
$y = Get-Content $LatestYml -Raw
$expected = ($y -split "`n" | Where-Object { $_ -match '^sha512:' } | Select-Object -First 1) -replace 'sha512:\s*', ''
if (-not $expected) { Write-Error "sha512 not found in latest.yml"; exit 3 }

# Compute actual sha512 of EXE and encode as base64
$h = Get-FileHash $Exe -Algorithm SHA512
$hex = $h.Hash
[byte[]]$bytes = for ($i=0; $i -lt $hex.Length; $i+=2) { [Convert]::ToByte($hex.Substring($i,2),16) }
$actual = [Convert]::ToBase64String($bytes)

if ($actual -eq $expected) {
  Write-Output "SHA512: OK"
} else {
  Write-Output "SHA512: MISMATCH"
  Write-Output ("expected: " + $expected)
  Write-Output ("actual:   " + $actual)
  exit 4
}
