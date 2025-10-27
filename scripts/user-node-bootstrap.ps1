Param(
  [string]$NodeZipUrl = "https://nodejs.org/dist/v20.17.0/node-v20.17.0-win-x64.zip",
  [string]$InstallRoot = "$env:LOCALAPPDATA\Programs\nodejs"
)
$ErrorActionPreference = "Stop"
Write-Host "USER-NODE-BOOTSTRAP (admin yok)" -ForegroundColor Cyan

try { Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force } catch {}

if (!(Test-Path $InstallRoot)) { New-Item -ItemType Directory -Path $InstallRoot | Out-Null }

$nodeExe = Join-Path $InstallRoot "node.exe"
if (!(Test-Path $nodeExe)) {
  $tmp = Join-Path $env:TEMP ("node_portable_"+[Guid]::NewGuid().ToString()+".zip")
  Write-Host "Node portable indiriliyor" -ForegroundColor Yellow
  try {
    Invoke-WebRequest -Uri $NodeZipUrl -OutFile $tmp -UseBasicParsing
    Write-Host "Arsiv aciliyor" -ForegroundColor Yellow
    $tmpExtract = Join-Path $env:TEMP ("node_extract_"+[Guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tmpExtract | Out-Null
    Expand-Archive -Path $tmp -DestinationPath $tmpExtract
    $nodeDir = Get-ChildItem $tmpExtract -Directory | Select-Object -First 1
    Copy-Item -Path (Join-Path $nodeDir.FullName "*") -Destination $InstallRoot -Recurse -Force
    Remove-Item $tmp -Force
    Remove-Item $tmpExtract -Recurse -Force
    Write-Host "Node portable kuruldu" -ForegroundColor Green
  } catch {
    Write-Host "Node indirme basarisiz: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Manuel adim: https://nodejs.org -> LTS MSI indir" -ForegroundColor Cyan
    throw "Node kurulamadi"
  }
} else {
  Write-Host "Portable Node zaten mevcut" -ForegroundColor Green
}

function Add-UserPath([string]$p) {
  $userPath = [System.Environment]::GetEnvironmentVariable("Path","User")
  if (-not ($userPath -split ";" | Where-Object { $_ -eq $p })) {
    [System.Environment]::SetEnvironmentVariable("Path", ($userPath.TrimEnd(";")+";"+$p), "User")
    Write-Host "USER PATH'e eklendi: $p" -ForegroundColor Green
  } else {
    Write-Host "USER PATH zaten iceriyor: $p" -ForegroundColor DarkGray
  }
}
Add-UserPath $InstallRoot
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "Oturum PATH yenilendi" -ForegroundColor Green

try {
  $nodeV = (& "$nodeExe" -v)
  Write-Host "Node $nodeV" -ForegroundColor Green
} catch {
  Write-Host "Node calismiyor: $($_.Exception.Message)" -ForegroundColor Red
  throw "Node kurulumu basarisiz"
}

$npmExe = Join-Path $InstallRoot "npm.cmd"
$corepackCmd = Join-Path $InstallRoot "corepack.cmd"
if (!(Test-Path $corepackCmd)) {
  & $npmExe i -g corepack | Out-Null
  $corepackCmd = "corepack"
}
Write-Host "corepack enable" -ForegroundColor Cyan
& $corepackCmd enable | Out-Null
Write-Host "corepack prepare pnpm@10.14.0 --activate" -ForegroundColor Cyan
& $corepackCmd prepare pnpm@10.14.0 --activate | Out-Null

$env:NODE_OPTIONS="--max-old-space-size=4096"
Write-Host "pnpm -w install" -ForegroundColor Cyan
pnpm -w install
Write-Host "pnpm -w build" -ForegroundColor Cyan
pnpm -w build
Write-Host "USER-NODE-BOOTSTRAP tamam" -ForegroundColor Green
