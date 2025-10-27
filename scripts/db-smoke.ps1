$ErrorActionPreference = "Stop"

if (-not $env:PRISMA_DATABASE_URL) { 
    Write-Host "PRISMA_DATABASE_URL not set; using JSONL fallback" 
    exit 0 
}

Write-Host "DB Smoke Test - Prisma Mode"
Write-Host "Database URL: $env:PRISMA_DATABASE_URL"

pushd services/marketdata

Write-Host "Generating Prisma client..."
pnpm prisma:generate | Out-Null

Write-Host "Pushing schema to database..."
pnpm db:push | Out-Null

popd

Write-Host "DB smoke PASS"
