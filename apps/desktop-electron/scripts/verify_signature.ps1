param([string]$File)
if(-not $File){ Write-Error "Usage: verify_signature.ps1 <path-to-exe>"; exit 2 }
Write-Host "Checking Authenticode:" -ForegroundColor Cyan
Get-AuthenticodeSignature -FilePath $File | Format-List
Write-Host "Checking timestamp & chain (signtool):" -ForegroundColor Cyan
$env:Path += ";C:\Program Files (x86)\Windows Kits\10\bin\x64"
signtool verify /pa /all /d /v $File


