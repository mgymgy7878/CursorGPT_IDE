Param(
  [string]$WantedNode="LTS",
  [switch]$UseChocolatey
)
$ErrorActionPreference="Stop"
Write-Host "ENV-RESCUE: Node/PATH/corepack/pnpm kurtarma" -ForegroundColor Cyan

function Add-MachinePath([string]$path) {
  $current = [System.Environment]::GetEnvironmentVariable("Path","Machine")
  if (-not ($current -split ";" | Where-Object { $_ -eq $path })) {
    $new = ($current.TrimEnd(";") + ";" + $path)
    [System.Environment]::SetEnvironmentVariable("Path",$new,"Machine")
    Write-Host "PATH'e eklendi (Machine): $path" -ForegroundColor Green
  } else { Write-Host "PATH zaten iceriyor: $path" -ForegroundColor DarkGray }
}

function Refresh-SessionPath {
  $machine = [System.Environment]::GetEnvironmentVariable("Path","Machine")
  $user    = [System.Environment]::GetEnvironmentVariable("Path","User")
  $env:Path = ($machine + ";" + $user)
  Write-Host "Oturum PATH yenilendi" -ForegroundColor Green
}

try { Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force } catch {}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Host "Node PATH'te degil. Yaygin dizinleri kontrol ediyorum..." -ForegroundColor Yellow
  $candidates = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
  )
  $nodeFound=$false
  foreach($c in $candidates){
    if (Test-Path (Join-Path $c "node.exe")) {
      Add-MachinePath $c
      $nodeFound=$true
      break
    }
  }
  Refresh-SessionPath
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $nodeCmd -and -not $nodeFound) {
    Write-Host "Node bulunamadi. Kurulum deneniyor..." -ForegroundColor Red
    $installed=$false
    if (Get-Command winget -ErrorAction SilentlyContinue) {
      try {
        Write-Host "winget: OpenJS.NodeJS.LTS kurulumu" -ForegroundColor Yellow
        winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements | Out-Null
        $installed=$true
      } catch { Write-Host "winget basarisiz: $($_.Exception.Message)" -ForegroundColor DarkRed }
    }
    if (-not $installed -and $UseChocolatey -and (Get-Command choco -ErrorAction SilentlyContinue)) {
      try {
        Write-Host "choco: nodejs-lts kurulumu" -ForegroundColor Yellow
        choco install nodejs-lts -y | Out-Null
        $installed=$true
      } catch { Write-Host "choco basarisiz: $($_.Exception.Message)" -ForegroundColor DarkRed }
    }
    if (-not $installed) {
      Write-Host "Manuel adim: https://nodejs.org -> LTS MSI indir, kurulurken Add to PATH kutusunu isaretle." -ForegroundColor Cyan
      throw "Node kurulamadi. Manuel kurulum gerekli."
    }
    Add-MachinePath "C:\Program Files\nodejs"
    Refresh-SessionPath
  }
}

try {
  $nodeV = node -v
  Write-Host "Node: $nodeV" -ForegroundColor Green
} catch { throw "Node calismiyor: $($_.Exception.Message)" }

try {
  Write-Host "corepack enable" -ForegroundColor Cyan
  corepack enable | Out-Null
} catch {
  Write-Host "corepack yok, npm ile yukleniyor..." -ForegroundColor Yellow
  npm i -g corepack | Out-Null
  corepack enable | Out-Null
}
Write-Host "pnpm@10.14.0 activate" -ForegroundColor Cyan
corepack prepare pnpm@10.14.0 --activate | Out-Null
pnpm -v | Out-Null
Write-Host "pnpm aktif" -ForegroundColor Green

$env:NODE_OPTIONS="--max-old-space-size=4096"
Write-Host "pnpm -w install" -ForegroundColor Cyan
pnpm -w install
Write-Host "pnpm -w build" -ForegroundColor Cyan
pnpm -w build

Write-Host "ENV-RESCUE tamam" -ForegroundColor Green
