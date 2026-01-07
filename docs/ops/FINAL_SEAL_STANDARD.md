# Final Mühür Standardizasyonu

**Tanım:** Her release öncesi uygulanacak, kanıt üreten deterministik süreç.

---

## 🔒 Final Mühür = 4 Ayak (Hepsi Gerekli)

### 1. Pozitif Kanıt Paketi ✅
**Koşul:** Executor healthy, DB connected

**Komut:**
```powershell
# 1. Dev stack'i full başlat (Executor dahil)
.\scripts\dev-stack.ps1

# 2. Executor'ın healthy olmasını bekle (yaklaşık 10-15 saniye)

# 3. Full verification (SkipExecutorCheck OLMADAN)
pnpm verify:final
```

**Klasör:** `evidence/final_verification_YYYY_MM_DD_HH_MM_SS/`

**Altın Sinyaller:**
- ✅ PostgreSQL: `healthy`
- ✅ Prisma: `Database schema is up to date`
- ✅ Executor /health: `{"status":"healthy","db":"connected"}` (HTTP 200)
- ✅ /v1/audit/verify: `{"verified":true}`
- ✅ Export JSONL + SHA256 checksum match

---

### 2. Negatif Kanıt Paketi ✅
**Koşul:** Degradation senaryoları (DB down, Executor down)

**Komut:**
```powershell
pnpm verify:negative
```

**Klasör:** `evidence/negative_tests_YYYY_MM_DD_HH_MM_SS/` (henüz toplanmadı - komut: `pnpm verify:negative`)

**Beklenen Davranışlar:**
- ✅ **DB down:** Executor /health → `{"status":"degraded","db":"disconnected"}` (HTTP 200 kalmalı)
- ✅ **Executor down:** Web /api/health → 503/connection error; UI action butonları disabled + tooltip

---

### 3. UI Manual Checklist ✅
**Süre:** ~30 saniye

**Dosya:** `docs/ops/UI_MANUAL_CHECKLIST_FINAL.md`

**Kontroller:**
1. ✅ Settings > Connection Health (yeşil/amber/kırmızı durumlar net)
2. ✅ Control > Audit tab: Integrity badge + Export butonu
3. ✅ /audit/all: pagination + tek scroll (terminal density)

**Kanıt:** En azından 2-3 screenshot (opsiyonel ama önerilir)

---

### 4. Evidence Index Güncel ✅
**Dosya:** `docs/ops/FINAL_EVIDENCE_INDEX.md`

**Gereksinimler:**
- ✅ Pozitif ve negatif paketler ayrı ayrı listelenmiş
- ✅ Hangi klasör hangi koşulda üretildi net
- ✅ Altın sinyaller tanımlı
- ✅ Regression matrix güncel

---

## ⚠️ Kritik Not

**Bu dört ayak yoksa "mühür" değil, "yarım mühür" oluyor. Evren acımasız.**

Sadece pozitif paket → "Çalışıyor mu?" kanıtı var ama degradation davranışı yok
Sadece negatif paket → "Bozulunca doğru mu davranıyor?" kanıtı var ama "çalışıyor mu?" kanıtı yok
Her ikisi de yok → "Mühür" değil, "güven eksikliği"

---

## 📋 Release Öncesi Checklist

- [ ] Pozitif kanıt paketi toplandı (Executor healthy)
- [ ] Negatif kanıt paketi toplandı (DB down + Executor down)
- [ ] UI manual checklist tamamlandı (30 saniyelik tur)
- [ ] Evidence index güncellendi (pozitif + negatif paketler listelenmiş)
- [ ] Tüm altın sinyaller yeşil
- [ ] Screenshot'lar alındı (opsiyonel ama önerilir)

---

## 🎯 Başarı Kriterleri

**✅ Başarılı (Full Mühür):**
- 4 ayak tamamlandı
- Pozitif paket: healthy + db:connected + verified:true
- Negatif paket: degraded/down davranışları doğru
- UI checklist: Tüm kontroller geçti
- Evidence index güncel

**⚠️ Uyarı (Yarım Mühür):**
- 3/4 ayak tamamlandı
- Bazı kontroller başarısız ama degradation doğru
- Evidence index eksik

**❌ Başarısız (Mühür Yok):**
- 2 veya daha az ayak tamamlandı
- Pozitif paket eksik veya negatif paket eksik
- Altın sinyaller kırmızı
- Evidence index güncel değil

---

**Bu standardizasyon, her release'de aynı kanıtı üretmeyi garanti eder.**

