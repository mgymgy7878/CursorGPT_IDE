# Final Evidence Index - Production Ready Milestone

**Tarih:** 29 Ocak 2025
**Milestone:** P0-P8 Tamamlama - Mock kokusu kayboldu, gerçek terminal

---

## 🎯 Bu Milestone'da Ne Yapıldı?

### P0-P2: Database + Executor Foundation

- ✅ PostgreSQL container (Docker Compose)
- ✅ Prisma schema + migrations
- ✅ Executor DB entegrasyonu
- ✅ Health endpoint (DB connectivity check)
- ✅ Seed data (user, strategies, positions, trades, audit)

### P3-P5: UI Gerçek Veriye Bağlandı

- ✅ Strategies sayfaları API'ye bağlandı
- ✅ Audit logları gerçek DB'den
- ✅ Positions ve Trades endpoint'leri
- ✅ Navigation badge'ler gerçek sayılara bağlandı

### P6-P8: Production Features

- ✅ Cursor pagination (scroll-safe)
- ✅ Full list pages (/strategies/all, /audit/all)
- ✅ Start/Pause/Stop actions (idempotency + audit)
- ✅ Audit integrity verify (hash chain)
- ✅ Audit export (JSONL + SHA256 checksum)
- ✅ Executor health checks (UI güvenlik)

---

## 📁 Evidence Klasörleri

### 1. Initial Smoke Test

**Klasör:** `evidence/smoke_2025_01_29/`

**İçerik:**

- Docker compose postgres status
- Prisma migration status
- Executor health check

**Sonuç:** ✅ PostgreSQL healthy, migration tamamlandı, Executor çalışıyor

---

### 2. Final Verification (POZİTİF - Executor Healthy)

**Klasör:** `evidence/final_verification_YYYY_MM_DD_HH_MM_SS/`

**Oluşturma:**

```powershell
# 1. Dev stack'i full başlat (Executor dahil)
.\scripts\dev-stack.ps1

# 2. Executor'ın healthy olmasını bekle (yaklaşık 10-15 saniye)
# 3. Full verification (SkipExecutorCheck OLMADAN)
pnpm verify:final
# veya
.\scripts\verify-final.ps1
```

**Koşul:** Executor **healthy** ve DB **connected** durumda olmalı.

**Gerçek Klasörler:**

- `evidence/final_verification_2025_01_29/` (Executor healthy iken toplandı)

**İçerik:**

- `docker_compose_ps_postgres.log` - PostgreSQL container status
- `docker_compose_logs_postgres_tail80.log` - PostgreSQL logs
- `prisma_migrate_status.log` - Migration status
- `curl_health.json` - Executor health
- `curl_audit_verify.json` - Audit integrity verify
- `curl_strategies.json` - Strategies list
- `curl_positions.json` - Open positions
- `curl_trades.json` - Recent trades
- `web_audit_verify.json` - Web proxy verify
- `audit_export.jsonl` - Full audit export
- `audit_export.jsonl.sha256` - SHA256 checksum
- `audit_export_sample.txt` - First 20 lines

**Altın Sinyaller:**

- ✅ Postgres: `healthy`
- ✅ Prisma: `Database schema is up to date`
- ✅ Executor /health: `{"status":"healthy","db":"connected"}`
- ✅ /v1/audit/verify: `{"verified":true}`

---

### 3. Negative Tests (NEGATİF - Degradation Senaryoları)

**Klasör:** `evidence/negative_tests_YYYY_MM_DD_HH_MM_SS/` (komut: `pnpm verify:negative` ile toplanır, timestamp formatı)

**Gerçek Klasör:**

- `evidence/negative_tests_2026_01_01_23_02_07/` (DB-down + Executor-down kanıtları ile tam paket)
  - **Not:** Bu paket PowerShell 5.1 ile üretildi (pwsh PATH'te yoktu). PS7 ile yeniden üretildiğinde yeni klasör adı ayrıca eklenecek.

**Not:** Negatif paket klasör adı timestamp formatında oluşturulur. En son klasörü bulmak için:

```powershell
Get-ChildItem evidence -Directory | Where-Object { $_.Name -match '^negative_tests_' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

**Oluşturma:** `pnpm verify:negative` veya `.\scripts\verify-negative-tests.ps1`

**Koşul:** Executor down veya DB down durumunda test edilir.

**İçerik:**

- `negative_test_db_down_health.json` - DB down senaryosu
- `negative_test_executor_down_health.json` - Executor down senaryosu

**Beklenen Davranış:**

- DB down: `{"status":"degraded","db":"disconnected"}`
- Executor down: `503` veya connection error

---

## ✅ UI Manual Checklist

**Dosya:** `evidence/final_verification_2025_01_29/UI_MANUAL_CHECKLIST.md`

**Kontrol Noktaları:**

- [x] Control > Audit tab: Integrity badge + Export butonu
- [x] /audit/all: Integrity badge + Export + Cursor pagination
- [x] RunningStrategiesPage: Action butonları Executor health'e göre disabled
- [x] Console: Hydration warning yok
- [x] Terminal density: Scroll-safe (maxRows, tek scroll)

---

## 🔧 Verification Komutları

```powershell
# Tüm verification (full evidence)
pnpm verify:final

# Negatif testler (degradation senaryoları)
pnpm verify:negative

# Release gate kontrolü (mühür durumu)
pnpm release:gate

# Dev stack başlatma
.\scripts\dev-stack.ps1
```

**PowerShell 7+ Kurulum Notu:**

Script'ler PowerShell 7+ (pwsh) ile çalışacak şekilde tasarlanmıştır. Eğer `pwsh` PATH'te yoksa, otomatik olarak PowerShell 5.1 (powershell) fallback kullanılır.

**Windows'ta PS7 Kurulumu (önerilen):**

```powershell
# winget ile (1 satır)
winget install --id Microsoft.PowerShell

# Kurulum sonrası yeni terminal açın veya PATH'i yenileyin
```

**Not:** Fallback mevcut olduğu için PS5.1 ile de çalışır, ancak encoding/çıktı tutarlılığı için PS7+ önerilir.

---

## 📊 Regression Matrix

**Her verification sonrası kontrol edilecekler:**

1. **Infrastructure:**
   - [ ] PostgreSQL container healthy
   - [ ] Prisma migrations up to date
   - [ ] Executor health: healthy + db connected

2. **API Endpoints:**
   - [ ] GET /v1/strategies?limit=6 → ok + data
   - [ ] GET /v1/audit/verify?limit=200 → verified:true
   - [ ] GET /v1/positions/open?limit=6 → ok + data
   - [ ] GET /v1/trades/recent?limit=10 → ok + data

3. **Web Proxies:**
   - [ ] GET /api/health → healthy/degraded/down
   - [ ] GET /api/audit/verify → verified
   - [ ] GET /api/audit/export → JSONL download

4. **UI:**
   - [ ] Integrity badge doğru renkte
   - [ ] Export butonu çalışıyor
   - [ ] Action butonları Executor down ise disabled

---

## 🚨 Kritik Negatif Testler

### DB Down Senaryosu

```powershell
docker compose stop postgres
curl.exe http://127.0.0.1:4001/health
# Beklenen: {"status":"degraded","db":"disconnected"}
docker compose start postgres
```

### Executor Down Senaryosu

```powershell
# Executor'ı durdur (Ctrl+C veya process kill)
curl.exe http://127.0.0.1:3003/api/health
# Beklenen: 503 veya connection error
```

---

## 📋 .env Disiplin Kuralları

**Kural:** Root `.env` tek kaynak, gölge dosyalar yasak

**İzin verilen:**

- ✅ Root `.env` (monorepo için)
- ✅ `.env.example` (template)

**Yasak:**

- ❌ `prisma/.env`
- ❌ `services/executor/.env`
- ❌ `apps/web-next/.env`

**Sebep:** Monorepo'da env loader root `.env`'yi okuyor. Gölge dosyalar conflict yaratır.

---

## 🔐 Audit Export Checksum

Her export'ta SHA256 checksum oluşturulur:

**Format:**

```
<sha256_hash>  audit_export.jsonl
```

**Doğrulama:**

```powershell
# Windows
Get-FileHash -Path audit_export.jsonl -Algorithm SHA256

# Linux/Mac
sha256sum audit_export.jsonl
```

---

## 📅 Son Güncelleme

**Milestone:** P0-P8 Completion
**Tarih:** 29 Ocak 2025
**Kanıt Paketi:** `evidence/final_verification_2025_01_29/`

---

## 🔄 Release-Grade Verification Rutini

**Dosya:** `docs/ops/RELEASE_GRADE_ROUTINE.md`

Her release öncesi bu rutini çalıştır:

1. Dev stack temiz başlatma
2. Final verification (kanıt toplama)
3. Negatif testler (DB down + Executor down)
4. UI manuel mühür (30 saniyelik tur)
5. Disiplin kilidi kontrolü

---

**Bu milestone'dan sonra platform production-ready seviyede. Mock kokusu tamamen kayboldu!** 🚀

**Final Mühür:** Kanıt + Negatif Senaryo + Regression Matrix = Release-Grade Platform
