# Symlink & Developer Mode Readiness (Windows)
$Key = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock'
$Dev = (Get-ItemProperty -Path $Key -Name 'AllowDevelopmentWithoutDevLicense' -ErrorAction SilentlyContinue).AllowDevelopmentWithoutDevLicense
$Priv = (whoami /priv | Select-String 'SeCreateSymbolicLinkPrivilege')
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Output "DEV_MODE: $Dev"
Write-Output "HAS_SeCreateSymbolicLinkPrivilege: $([bool]$Priv)"
Write-Output "IS_ADMIN: $IsAdmin"
if(($Dev -eq 1) -or $IsAdmin -or [bool]$Priv){ 
    Write-Output "SYMLINK_READY: PASS" 
    exit 0
} else { 
    Write-Output "SYMLINK_READY: ATTENTION (Developer Mode ON veya Admin PS aç)" 
    exit 1
}

