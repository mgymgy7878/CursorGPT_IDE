# 🧪 Canary Smoke Test — PR-6 UI Polish

## Amaç
PR-6'da yapılan değişikliklerin production'a benzer bir ortamda doğrulanması:
- Status LED tutarlılığı
- Birim standardizasyonu
- Tabular hizalama
- Copilot çakışması
- Backward compatibility

## ⏱️ Süre: 30-60 saniye

---

## 🚀 Ön Hazırlık

```powershell
# 1. Dev server başlat (zaten koşuyorsa atla)
cd apps/web-next
pnpm dev

# 2. Tarayıcı açık: http://127.0.0.1:3003
```

---

## ✅ Test Adımları

### 1. Health Endpoint Kontrolü (10sn)

```powershell
# Metrics endpoint
$metrics = iwr http://127.0.0.1:3003/api/public/metrics | ConvertFrom-Json
Write-Host "API Status: $($metrics.status)"

# Prometheus format
(iwr http://127.0.0.1:3003/api/public/metrics.prom).Content | Select-String 'build|staleness'
```

**Beklenen:**
- API responds 200
- staleness_ms metric exists
- build_info present

---

### 2. LED Davranış Testi (15sn)

**Route:** http://127.0.0.1:3003/dashboard

**Adımlar:**
1. Sayfayı F5 ile yenile
2. İlk 3 saniye header'daki 3 LED'i gözlemle
3. 5 saniye sonra LED renklerini not et

**Beklenen:**
- ✅ İlk 0-3sn: **Gri pulse** (API/WS/Executor)
- ✅ 3-5sn sonra: Gerçek durum
  - API: Yeşil (healthy) veya Kırmızı (down)
  - WS: Yeşil (connected) veya Kırmızı (disconnected)
  - Executor: Kırmızı (offline - mock ortam)

**❌ FAIL koşulu:**
- LED'ler baştan kırmızı (unknown state atlanmış)
- LED'ler 10sn+ gri pulse (timeout yok)

---

### 3. Birim Tutarlılığı (5sn)

**Route:** http://127.0.0.1:3003/dashboard

**Kontrol:**
- P95 Gecikme kartı: `"58 ms"` + `"Hedef: 1200 ms"`
- Güncellik Gecikmesi kartı: `"0 sn"` + `"Eşik: 30 sn"`

**Beklenen:**
- ✅ P95 → **ms** birimi
- ✅ Güncellik → **sn** birimi
- ✅ Hedef/eşik aynı birimde

**❌ FAIL koşulu:**
- Karışık birimler (ör. "Hedef: 1 sn" vs "58 ms")
- Birim eksik

---

### 4. Tabular Hizalama (10sn)

**Route:** http://127.0.0.1:3003/portfolio

**Kontrol:**
- Açık Pozisyonlar tablosunda 3 satır olmalı
- Fiyat, PnL, PnL% kolonları

**Beklenen:**
- ✅ Sayılar sağa hizalı
- ✅ Ondalık ayraçlar (,) alt alta
- ✅ Para birimi sembolü sabit yerde ($)
- ✅ Taşma yok (scroll gerekmez)

**❌ FAIL koşulu:**
- Sayılar sola hizalı
- Ondalık ayraçlar zigzag
- Hücre wrap ediyor veya taşıyor

---

### 5. Copilot Çakışması (10sn)

**Route:** http://127.0.0.1:3003/portfolio

**Kontrol:**
- Sayfanın sonuna scroll et
- Copilot butonunun konumunu gözlemle

**Beklenen:**
- ✅ Copilot butonu sağ altta sabit
- ✅ İçerikle çakışmıyor (padding var)
- ✅ Tablo satırlarının üstüne binmez

**❌ FAIL koşulu:**
- Copilot butonu tablo üstünde
- Son satır Copilot altında kalıyor

---

### 6. Empty State CTA Standardı (10sn)

**Routes:**
- http://127.0.0.1:3003/alerts
- http://127.0.0.1:3003/running

**Kontrol:**
- Alerts: "Henüz alert yok" + Lucide Bell icon + CTA butonu
- Running: "Şu anda çalışan strateji yok" + Lucide Activity icon + "Stratejilere Git" butonu

**Beklenen:**
- ✅ Icon boyutu tutarlı (size-10)
- ✅ CTA metni net ("Hızlı Uyarı Oluştur", "Stratejilere Git")
- ✅ Icon Lucide (emoji değil)

**❌ FAIL koşulu:**
- Emoji icon
- Buton metni karışık
- Icon boyutu farklı

---

### 7. Çift Sidebar Kontrolü (5sn)

**Routes:**
- http://127.0.0.1:3003/portfolio
- http://127.0.0.1:3003/settings

**Kontrol:**
- DevTools → Elements → `<aside>` tag sayısı

**Beklenen:**
- ✅ Tek `<aside>` (LeftNav)
- ✅ İçerik tam genişlikte
- ✅ Boş kolon yok

**❌ FAIL koşulu:**
- İki `<aside>` tag
- Sol tarafta boş gri şerit
- İçerik daralmış

---

### 8. Backward Compatibility (5sn)

**Kod Kontrolü:**

```typescript
// StatusDot eski API destekliyor mu?
<StatusDot ok={true} />  // ✅ çalışmalı
<StatusDot ok={false} /> // ✅ çalışmalı
<StatusDot status="up" /> // ✅ yeni API
```

**Test:**
- DevTools Console'da hata yok
- Tüm sayfalar render oluyor

**Beklenen:**
- ✅ Console temiz (warning yok)
- ✅ Tüm rotalar yükleniyor

**❌ FAIL koşulu:**
- Console'da "StatusDot.ok deprecated" warning
- Herhangi bir sayfada render hatası

---

## 📊 Sonuç Raporu

### ✅ PASS Örneği
```
[PASS] LED Davranışı: unknown → up transition 3sn
[PASS] Birim Tutarlılığı: P95 ms, Staleness sn
[PASS] Tabular Hizalama: Sayılar sağa hizalı, tr-TR format
[PASS] Copilot: İçerikle çakışma yok
[PASS] Empty State: Icon size-10, CTA standardize
[PASS] Çift Sidebar: Tek aside tag
[PASS] Backward Compat: ok prop çalışıyor
[PASS] Console: Temiz

RESULT: ✅ ALL TESTS PASSED (8/8)
```

### ❌ FAIL Örneği
```
[FAIL] LED Davranışı: İlk yüklemede direkt kırmızı (unknown atlandı)
[PASS] Birim Tutarlılığı: OK
[FAIL] Tabular Hizalama: Ondalık ayraçlar zigzag
[PASS] Copilot: OK
[PASS] Empty State: OK
[PASS] Çift Sidebar: OK
[PASS] Backward Compat: OK
[WARN] Console: 2x "Deprecated prop" warning

RESULT: ❌ FAILED (2 fail, 1 warn)
ACTION: Fix LED unknown state + tabular CSS
```

---

## 🔧 Hata Ayıklama

### LED'ler Unknown Atlanıyor
```typescript
// hooks/useUnifiedStatus.ts kontrol et
const { isLoading } = useHeartbeat();
if (isLoading) return 'unknown'; // Bu satır var mı?
```

### Tabular Zigzag
```css
/* globals.css kontrol et */
.tabular {
  font-variant-numeric: tabular-nums; /* Bu kural var mı? */
}
```

### Copilot Çakışması
```css
/* globals.css kontrol et */
.safe-bottom {
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}
```

---

## 📝 Notlar

- Test her deploy öncesi manuel çalıştırılmalı
- Canary fail durumunda PR merge edilmemeli
- Warn durumunda düzeltme + retest gerekli
- Production deploy sonrası smoke tekrarlanmalı

---

**Son Güncelleme:** 2025-10-29
**Test Eden:** PR reviewer
**Ortam:** Local dev (127.0.0.1:3003)
**Tarayıcı:** Chrome/Edge latest

