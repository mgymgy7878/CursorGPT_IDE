param(
  [Parameter(Mandatory=$true)][string]$ArtifactsDir,
  [Parameter(Mandatory=$true)][string]$DestDir,
  [string]$Channel = 'beta'
)
$ErrorActionPreference = 'Stop'

function Copy-File($src, $dst) {
  New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
  Copy-Item -LiteralPath $src -Destination $dst -Force
}

$exe        = Get-ChildItem $ArtifactsDir -Filter '*.exe' | Sort-Object LastWriteTime -Desc | Select-Object -First 1
if (-not $exe) { throw 'No EXE found in artifacts dir' }
$blockmap   = Get-Item -LiteralPath (Join-Path $ArtifactsDir ($exe.BaseName + '.blockmap')) -ErrorAction SilentlyContinue
$latestSrc  = Join-Path $ArtifactsDir 'latest.yml'
if (-not (Test-Path -Path $latestSrc -PathType Leaf)) { throw 'latest.yml not found in artifacts dir' }

$channelDir = Join-Path $DestDir $Channel
New-Item -ItemType Directory -Force -Path $channelDir | Out-Null

# 1) Upload .exe and .blockmap first
Copy-File $exe.FullName (Join-Path $channelDir $exe.Name)
if ($blockmap) { Copy-File $blockmap.FullName (Join-Path $channelDir $blockmap.Name) }

# 2) Write latest.yml.tmp then atomic rename to latest.yml
$tmp = Join-Path $channelDir 'latest.yml.tmp'
Copy-Item -LiteralPath $latestSrc -Destination $tmp -Force
Rename-Item -LiteralPath $tmp -NewName 'latest.yml' -Force

Write-Host "Atomic publish done -> $channelDir"

