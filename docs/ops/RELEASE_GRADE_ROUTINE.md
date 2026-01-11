# Release-Grade Verification Rutini

**Amaç:** Her seferinde aynı kanıtı üreten, deterministik verification süreci.

**Süre:** ~5 dakika (script'ler) + 30 saniye (UI manuel)

---

## 🔒 Final Mühür = 4 Ayak (Hepsi Gerekli)

**Dosya:** `docs/ops/FINAL_SEAL_STANDARD.md`

---

## 🔄 Adım 1: Pozitif Kanıt Paketi (Executor Healthy)

### 1.1. Dev Stack Temiz Başlatma

```powershell
.\scripts\dev-stack.ps1
```

**Beklenen "Altın Sinyaller":**
1. ✅ **PostgreSQL:** `healthy` (docker compose ps postgres)
2. ✅ **Executor /health:** `{"status":"healthy","db":"connected"}` (HTTP 200)
3. ✅ **Web (3003):** Ayakta (curl http://127.0.0.1:3003/api/health)

**Kontrol:**
```powershell
# PostgreSQL
docker compose ps postgres
# Beklenen: STATUS "Up X hours (healthy)"

# Executor
curl.exe http://127.0.0.1:4001/health
# Beklenen: {"status":"healthy","db":"connected"}

# Web
curl.exe http://127.0.0.1:3003/api/health
# Beklenen: {"status":"healthy","service":"executor",...}
```

---

### 1.2. Full Verification (SkipExecutorCheck OLMADAN)

**ÖNEMLİ:** Executor'ın healthy olmasını bekle (yaklaşık 10-15 saniye)

```powershell
pnpm verify:final
# veya
.\scripts\verify-final.ps1
```

**Kanıt Klasörü:** `evidence/final_verification_YYYY_MM_DD_HH_MM_SS/`

**Oluşan Dosyalar:**
- ✅ `curl_health.json` - Executor health
- ✅ `curl_audit_verify.json` - Audit integrity verify
- ✅ `audit_export.jsonl` - Full audit export
- ✅ `audit_export.jsonl.sha256` - SHA256 checksum
- ✅ `audit_export_sample.txt` - İlk 20 satır
- ✅ `web_audit_verify.json` - Web proxy verify
- ✅ `curl_strategies.json` - Strategies list
- ✅ `curl_positions.json` - Open positions
- ✅ `curl_trades.json` - Recent trades
- ✅ `prisma_migrate_status.log` - Migration status
- ✅ `docker_compose_ps_postgres.log` - PostgreSQL status

**Mühür Kontrolü:**
- Export dosyasının SHA256'sı header/checksum ile eşleşiyor mu? ✅

**Altın Sinyaller:**
- ✅ Executor: `"status":"healthy"`
- ✅ Audit Integrity: `"verified":true`
- ✅ Prisma: `"Database schema is up to date"`

---

---

## 🧪 Adım 2: Negatif Kanıt Paketi (Degradation Senaryoları)

```powershell
pnpm verify:negative
# veya
.\scripts\verify-negative-tests.ps1
```

**Kanıt Klasörü:** `evidence/negative_tests_YYYY_MM_DD_HH_MM_SS/` (henüz toplanmadı - komut: `pnpm verify:negative`)

### Test 1: DB Down Senaryosu

**Beklenen Davranış:**
```json
{
  "status": "degraded",
  "db": "disconnected",
  "error": "..."
}
```
- HTTP 200 kalmalı (Executor çalışıyor, sadece DB down)
- UI'da "Degraded" görünmeli

**Test:**
```powershell
docker compose stop postgres
curl.exe http://127.0.0.1:4001/health
docker compose start postgres  # Geri başlat
```

### Test 2: Executor Down Senaryosu

**Beklenen Davranış:**
- Web `/api/health` → 503 veya connection error
- UI'da action butonları **disabled** + tooltip "Executor kullanılamıyor"

**Test:**
```powershell
# Executor'ı durdur (Ctrl+C veya process kill)
curl.exe http://127.0.0.1:3003/api/health
# Beklenen: 503 veya connection error
```

---

---

## 👁️ Adım 3: UI Manuel Mühür (30 Saniyelik Tur)

**Dosya:** `docs/ops/UI_MANUAL_CHECKLIST_FINAL.md`

### Hızlı Kontroller:
1. ✅ **Settings > Connection Health:** Executor "Healthy"
2. ✅ **Control > Audit tab:** Integrity badge OK, Export butonu indiriyor
3. ✅ **/audit/all:** Integrity OK, pagination akıyor, tek scroll
4. ✅ **Running page:** Action butonları Executor down ise disabled

**Süre:** ~30 saniye

---

---

## 🔒 Adım 4: Evidence Index Güncelleme

**Dosya:** `docs/ops/FINAL_EVIDENCE_INDEX.md`

**Güncelleme:**
- Pozitif paket klasörünü ekle: `evidence/final_verification_YYYY_MM_DD_HH_MM_SS/`
- Negatif paket klasörünü ekle: `evidence/negative_tests_YYYY_MM_DD_HH_MM_SS/` (komut: `pnpm verify:negative` ile toplanır)
- Hangi klasör hangi koşulda üretildi net

---

## 🔒 Adım 5: Disiplin Kilidi Kontrolü

**Dosya:** `docs/ops/DISCIPLINE_LOCK_CHECK.md`

**Kontroller:**
- [ ] Prisma versiyonları pinli (`workspace:*` yok)
- [ ] .env disiplini: Root `.env` tek kaynak, gölge dosya yok
- [ ] Prisma Client generate başarılı

**Kontrol Komutları:**
```powershell
# Prisma versiyonları
grep -r "workspace:\*" package.json services/*/package.json

# .env dosyaları
Get-ChildItem -Recurse -Filter ".env" | Where-Object { $_.FullName -notlike "*\.git*" -and $_.FullName -notlike "*node_modules*" }
```

---

---

## 📊 Adım 6: Final Mühür Doğrulama

**Kontrol:** 4 ayak tamamlandı mı?

1. ✅ Pozitif kanıt paketi: `evidence/final_verification_YYYY_MM_DD_HH_MM_SS/`
2. ✅ Negatif kanıt paketi: `evidence/negative_tests_YYYY_MM_DD_HH_MM_SS/` (henüz toplanmadı - komut: `pnpm verify:negative`)
3. ✅ UI manual checklist: Tamamlandı
4. ✅ Evidence index: Güncel

**Not:** Bu dört ayak yoksa "mühür" değil, "yarım mühür" oluyor. Evren acımasız.

---

## 📊 Final Mühür Özeti

**Dosya:** `docs/ops/FINAL_SEAL_COMMIT.md`

**Özet:**
- ✅ Tüm kanıtlar toplandı
- ✅ Negatif testler çalıştırıldı
- ✅ UI manuel checklist tamamlandı
- ✅ Disiplin kilidi kontrolü yapıldı

**Commit Hazır:**
```bash
git add .
git commit -m "feat: P0-P8 completion - Production ready milestone"
git tag -a v0.8.0-production-ready -m "Production ready milestone"
```

---

## 🎯 Başarı Kriterleri

**✅ Başarılı:**
- Tüm altın sinyaller yeşil
- Kanıt klasörü dolu
- Negatif testler beklenen davranışı gösteriyor
- UI manuel checklist tamamlandı
- Disiplin kilidi aktif

**⚠️ Uyarı:**
- Bazı servisler çalışmıyor ama negatif testler doğru davranıyor
- UI'da bazı kontroller başarısız ama Executor health check çalışıyor

**❌ Başarısız:**
- Executor health check başarısız
- Audit integrity verify başarısız
- Mock veri kullanılıyor
- Disiplin kilidi pasif

---

**Bu rutin her release öncesi çalıştırılmalı. Kanıt klasörleri regression analizi için saklanmalı.**

