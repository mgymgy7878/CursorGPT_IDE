# scripts/install-node20-msi.ps1
$ErrorActionPreference = "Stop"
$version   = "v20.10.0"
$msiName   = "node-$version-x64.msi"
$download  = "https://nodejs.org/dist/$version/$msiName"
$tempDir   = Join-Path $env:TEMP "node20_installer"
$msiPath   = Join-Path $tempDir $msiName

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Write-Host "Downloading $download ..."
Invoke-WebRequest -Uri $download -OutFile $msiPath -UseBasicParsing

Write-Host "Installing Node.js $version (silent) ..."
$msiArgs = "/i `"$msiPath`" /qn /norestart"
$proc = Start-Process -FilePath "msiexec.exe" -ArgumentList $msiArgs -Wait -PassThru
if ($proc.ExitCode -ne 0) { throw "MSI install failed with code $($proc.ExitCode)" }

# refresh PATH for current session
$nodeBin = "C:\Program Files\nodejs"
if (-not (Test-Path $nodeBin)) { throw "Node folder not found at $nodeBin" }
$env:PATH = "$nodeBin;$env:PATH"

# verify
$nodeV = (& "$nodeBin\node.exe" -v)
Write-Host "Node version after install: $nodeV"
if ($nodeV -notlike "v20.10*") { throw "Unexpected node version: $nodeV" }

# ensure pnpm (global) aligned
npm -v | Out-Null
npm i -g pnpm@10 | Out-Null
pnpm -v
