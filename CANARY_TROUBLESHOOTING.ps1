# ═══════════════════════════════════════════════════════════
# CANARY TROUBLESHOOTING - Hızlı Çözümler
# ═══════════════════════════════════════════════════════════

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║         CANARY TROUBLESHOOTING                           ║" -ForegroundColor Yellow
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow

# ─── SORUN 1: Port 4001 Dolu (EADDRINUSE) ─────────────────
Write-Host "SORUN 1: Port 4001 Çakışması" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$port = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "⚠️  Port 4001 kullanımda!" -ForegroundColor Yellow
    Write-Host "   PID: $($port.OwningProcess)" -ForegroundColor Gray
    Write-Host "`nÇözüm:" -ForegroundColor White
    Write-Host "   Stop-Process -Id $($port.OwningProcess) -Force" -ForegroundColor Green
    Write-Host "   # VEYA:" -ForegroundColor Gray
    Write-Host "   taskkill /PID $($port.OwningProcess) /F`n" -ForegroundColor Green
} else {
    Write-Host "✅ Port 4001 boş`n" -ForegroundColor Green
}

# ─── SORUN 2: DuckDB Native Module ────────────────────────
Write-Host "SORUN 2: DuckDB Native Module Hatası" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Belirti: Cannot find module 'duckdb.node'" -ForegroundColor Gray
Write-Host "`nÇözüm:" -ForegroundColor White
Write-Host "   cd C:\dev\CursorGPT_IDE" -ForegroundColor Green
Write-Host "   pnpm -r rebuild" -ForegroundColor Green
Write-Host "   # Sonra executor:" -ForegroundColor Gray
Write-Host "   cd services\executor" -ForegroundColor Green
Write-Host "   `$env:REAL_ROUTES='run' ; pnpm dev`n" -ForegroundColor Green

# ─── SORUN 3: Redis Down ───────────────────────────────────
Write-Host "SORUN 3: Redis Bağlantı Hatası" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

try {
    $redisStatus = docker ps --filter "name=redis" --format "{{.Status}}" 2>$null
    if ($redisStatus) {
        Write-Host "✅ Redis: $redisStatus`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis bulunamadı" -ForegroundColor Yellow
        Write-Host "`nÇözüm:" -ForegroundColor White
        Write-Host "   docker start redis`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Docker kontrol edilemedi`n" -ForegroundColor Yellow
}

# ─── SORUN 4: Node Version Yanlış ─────────────────────────
Write-Host "SORUN 4: Node Version" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$nodeVersion = node -v
Write-Host "Mevcut: $nodeVersion" -ForegroundColor Gray

if ($nodeVersion -notmatch "v20") {
    Write-Host "⚠️  Node 20 gerekli!" -ForegroundColor Yellow
    Write-Host "`nÇözüm:" -ForegroundColor White
    Write-Host "   İndir: https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi" -ForegroundColor Green
    Write-Host "   Kur ve YENİ PowerShell aç`n" -ForegroundColor Green
} else {
    Write-Host "✅ Node 20 aktif`n" -ForegroundColor Green
}

# ─── ACIL ROLLBACK ─────────────────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host "           🔄 ACIL ROLLBACK (Mock Mode)" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Red

Write-Host "Executor terminal'inde:" -ForegroundColor White
Write-Host "   `$env:REAL_ROUTES=''" -ForegroundColor Yellow
Write-Host "   pnpm dev`n" -ForegroundColor Yellow
Write-Host "Tüm çağrılar mock'tan döner. UI etkilenmez.`n" -ForegroundColor Gray

