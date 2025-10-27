param([Parameter(Mandatory=$true)][string]$Cmd)
$ErrorActionPreference="Continue"
$global:LASTEXITCODE=0
Invoke-Expression $Cmd
$code = $LASTEXITCODE
Write-Host "::STEP::DONE::code=$code::time=$(Get-Date -Format o)"
exit $code
