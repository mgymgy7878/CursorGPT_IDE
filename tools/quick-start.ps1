#!/usr/bin/env pwsh
# Hızlı başlat - Port temizliği + dev server (tek satır)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process pnpm -ErrorAction SilentlyContinue | Stop-Process -Force
cd "$PSScriptRoot\..\apps\web-next"
$env:PORT="3003"
$env:NODE_OPTIONS="--max-old-space-size=4096"
pnpm dev

