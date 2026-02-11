# UI Manual Checklist - Final Mühür (30 Saniyelik Tur)

**Tarih:** 29 Ocak 2025
**Milestone:** P0-P8 Completion - Production Ready

**Not:** Bu checklist, Final Mühür'ün **3. ayağıdır**. Pozitif ve negatif kanıt paketleri ile birlikte tamamlanmalıdır.

---

## ⚡ Hızlı Doğrulama (30 Saniye)

**Kanıt:** Her kontrol için screenshot alınması önerilir (en azından 2-3 kritik ekran).

### 1. Settings > Connection Health ✅
- [ ] Executor durumu: **"Healthy"** (yeşil) veya **"Degraded"** (amber) veya **"Offline"** (kırmızı)
- [ ] Database: **"Connected"** (healthy durumda) veya **"Disconnected"** (degraded durumda)
- [ ] Durumlar net görünüyor (renk kodlaması doğru)

**Kontrol:** `/settings` → Connection Health paneli

**Kanıt:** Screenshot: `evidence/ui_manual_checklist/settings_connection_health_healthy.png` (veya degraded/offline)

---

### 2. Control > Audit Tab ✅
- [ ] **Integrity Badge:** Yeşil **"Integrity OK"** veya kırmızı **"BROKEN"** görünüyor
- [ ] Badge tooltip'e hover: Doğru mesaj görünüyor ("Audit hash zinciri doğrulandı" veya "bozuk: ...")
- [ ] **Export Butonu:** Tıklanabilir (Executor healthy ise), disabled değil
- [ ] Export butonuna tıklayınca: `audit_logs_*.jsonl` dosyası indiriliyor
- [ ] Audit logları gerçek verilerle dolu (seed data'dan)

**Kontrol:** `/control` → Audit tab

**Kanıt:** Screenshot: `evidence/ui_manual_checklist/control_audit_tab_integrity_ok.png`

---

### 3. Audit All Page ✅
- [ ] Sayfa açılıyor: `/audit/all`
- [ ] **Integrity Badge:** Yeşil "Integrity OK" görünüyor
- [ ] Audit logları listeleniyor (gerçek veriler)
- [ ] **Export Butonu:** Çalışıyor, JSONL indiriyor
- [ ] **"Daha fazla yükle"** butonu varsa çalışıyor (cursor pagination)
- [ ] **Scroll:** Tek outer scroll var, tablo içinde nested scroll yok (terminal density)

**Kontrol:** `/audit/all`

**Kanıt:** Screenshot: `evidence/ui_manual_checklist/audit_all_pagination.png`

---

### 4. Running Strategies Page ✅
- [ ] Stratejiler gerçek verilerle dolu (seed data'dan)
- [ ] **Action Butonları (Start/Pause/Stop):**
  - Executor healthy ise: Aktif ve tıklanabilir
  - Executor down ise: **Disabled** (gri) ve tooltip "Executor kullanılamıyor"
- [ ] Action butonuna tıklayınca: Confirmation dialog çıkıyor
- [ ] Action başarılı olunca: Sayfa refresh oluyor, status güncelleniyor

**Kontrol:** `/running`

---

### 5. Strategies All Page ✅
- [ ] Sayfa açılıyor: `/strategies/all`
- [ ] Tüm stratejiler listeleniyor
- [ ] **"Daha fazla yükle"** butonu varsa çalışıyor
- [ ] **Scroll:** Tek outer scroll var

**Kontrol:** `/strategies/all`

---

### 6. Navigation Badges ✅
- [ ] Sol navigasyon:
  - `/strategies`: Aktif strateji sayısı (badge'de)
  - `/running`: Açık pozisyon sayısı (badge'de)
  - `/control`: Son audit log sayısı (badge'de)

**Kontrol:** Sol sidebar badge'leri

---

## 🚨 Kritik Negatif Testler (UI)

### Executor Down Senaryosu
1. Executor'ı durdur (Ctrl+C veya process kill)
2. UI'da kontrol:
   - [ ] Settings > Connection Health: **"Offline"** veya **"Down"**
   - [ ] Running page: Action butonları **disabled** (gri)
   - [ ] Action buton tooltip: **"Executor kullanılamıyor"**
   - [ ] Control > Audit: Export butonu **disabled**

### DB Down Senaryosu
1. PostgreSQL'i durdur: `docker compose stop postgres`
2. UI'da kontrol:
   - [ ] Settings > Connection Health: **"Degraded"** (Executor çalışıyor ama DB yok)
   - [ ] Action butonları hala çalışabilir (Executor healthy) ama veri yok

---

## ✅ Checklist Özeti

### Temel Kontroller
- [x] Executor health endpoint çalışıyor
- [x] Audit integrity verify çalışıyor
- [x] Export JSONL indiriliyor + SHA256 checksum
- [x] Action butonları Executor health'e göre disabled
- [x] Navigation badge'leri gerçek sayıları gösteriyor

### Scroll & UX
- [x] Terminal density: Tek outer scroll, nested scroll yok
- [x] Cursor pagination çalışıyor
- [x] "Daha fazla yükle" butonları çalışıyor

### Güvenlik
- [x] Executor down ise action butonları disabled
- [x] Confirmation dialog'lar çalışıyor
- [x] Tooltip'ler doğru mesajları gösteriyor

---

## 📊 Başarı Kriterleri

**✅ Başarılı:** Tüm kontroller tamamlandı, hiçbir mock veri yok, Executor health checks çalışıyor.

**⚠️ Uyarı:** Bazı kontroller başarısız ama Executor/DB down senaryosu test edildi ve UI doğru davranıyor.

**❌ Başarısız:** Mock veri kullanılıyor, Executor health check çalışmıyor, action butonları her zaman aktif.

---

**Doğrulayan:** [Adınız]
**Tarih:** 29 Ocak 2025
**Sonuç:** ✅ Başarılı / ⚠️ Uyarı / ❌ Başarısız

