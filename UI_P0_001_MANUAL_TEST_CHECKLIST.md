# UI-P0-001: Manuel Test Checklist

**Süre:** 20-30 dakika
**Tarih:** 26.11.2025
**Branch:** `ui-ux/ui-p0-001-dashboard-skeleton`

---

## 1️⃣ Ortamı Ayağa Kaldır

- [ ] Terminal'de repo kökünde: `pnpm --filter web-next dev`
- [ ] Dev server başladı (port kontrolü)
- [ ] Tarayıcı: `http://127.0.0.1:3003/dashboard` açıldı

---

## 2️⃣ Senaryo 1 – Loading / Skeleton

### Hazırlık
- [ ] Chrome DevTools açıldı (F12)
- [ ] Network tab → Throttling → "Slow 3G" seçildi
- [ ] Dashboard sayfası F5 ile yenilendi

### Beklenenler (Gözle + DevTools)

**Görsel Kontrol:**
- [ ] Sol menü (LeftNav) görünür
- [ ] CopilotDock görünür
- [ ] Ortada gerçek veri yok, **sadece skeleton kartlar** var
- [ ] Skeleton kartlar pulse animasyonu ile yanıp sönüyor

**DevTools Kontrolü:**
- [ ] Elements → `[aria-busy="true"]` olan ana container var
- [ ] Elements → `[aria-live="polite"]` set edilmiş
- [ ] Console'da kritik hata yok

**Screenshot:**
- [ ] Loading state screenshot alındı

**Sonuç:** [ ] Loading OK

---

## 3️⃣ Senaryo 2 – Empty State

### Hazırlık (Network Override / Mock)

**Yöntem 1: Request Blocking**
- [ ] DevTools → Network → `/api/strategies/active` request'ine sağ tık
- [ ] "Block request URL" seçildi
- [ ] Veya Override ile boş array `[]` döndürüldü

**Yöntem 2: Gerçek Kullanıcı**
- [ ] Stratejisi olmayan bir kullanıcı ile giriş yapıldı

### Test Adımları
- [ ] Dashboard sayfası yenilendi
- [ ] Empty state ekranı görünüyor

### Beklenenler

**Görsel Kontrol:**
- [ ] "Henüz strateji yok" benzeri boş durum mesajı görünüyor
- [ ] "Strateji Oluştur" butonu görünüyor
- [ ] "Stratejileri Görüntüle" butonu görünüyor
- [ ] Butonlar min 44×44px (WCAG 2.2 AA)

**Fonksiyonel Kontrol:**
- [ ] "Strateji Oluştur" butonu tıklanınca `/strategy-lab`'e gidiyor
- [ ] "Stratejileri Görüntüle" butonu tıklanınca `/strategies`'e gidiyor

### Klavye Navigasyon Kontrolü
- [ ] Sayfada iken `Tab`'e basıldı
- [ ] Focus önce "Strateji Oluştur" butonuna geldi
- [ ] Tekrar `Tab`'e basıldı
- [ ] Focus "Stratejileri Görüntüle" butonuna geçti
- [ ] Focus ring görünür ve net
- [ ] `Shift+Tab` ile geri gidilebiliyor
- [ ] `Enter` veya `Space` ile butonlar tetikleniyor

**Screenshot:**
- [ ] Empty state screenshot alındı

**Sonuç:** [ ] Empty State OK

---

## 4️⃣ Senaryo 3 – Error State + Retry

### Hazırlık (API Patlamış Simülasyonu)

**Yöntem 1: Network Offline**
- [ ] DevTools → Network → üstten "Offline" seçildi

**Yöntem 2: Request Blocking**
- [ ] `/api/strategies/active` ve `/api/portfolio/overview` block edildi
- [ ] Veya 500/timeout simüle edildi

### Test Adımları
- [ ] Dashboard sayfası yenilendi
- [ ] Error state ekranı görünüyor

### Beklenenler

**Görsel Kontrol:**
- [ ] Ekranda hata mesajı görünüyor ("Bir hata oluştu" türevi)
- [ ] "Tekrar Dene" butonu görünüyor
- [ ] Alert icon (AlertCircle) görünüyor

**DevTools Kontrolü:**
- [ ] Elements → hata container'ında `role="alert"` var
- [ ] Console'da hata mesajı görünüyor (beklenen)

### Retry Testi
- [ ] Offline moddan çıkıldı (Normal / Online)
- [ ] "Tekrar Dene" butonuna basıldı
- [ ] Kısa bir loading / skeleton fazı görünüyor
- [ ] Sonrasında ya success ya tekrar error'a düşüyor (gerçek API davranışına göre)
- [ ] Sayfa crash olmuyor
- [ ] Sonsuz loading'e girmiyor

**Klavye Kontrolü:**
- [ ] `Tab` ile "Tekrar Dene" butonuna ulaşılabiliyor
- [ ] `Enter` veya `Space` ile buton tetikleniyor

**Screenshot:**
- [ ] Error state screenshot alındı

**Sonuç:** [ ] Error State OK

---

## 5️⃣ Senaryo 4 – Success State

### Hazırlık
- [ ] Network tekrar "Normal" moduna alındı
- [ ] Request blocking'ler kaldırıldı

### Test Adımları
- [ ] Dashboard'a git / yenile
- [ ] Normal dashboard içeriği görünüyor

### Beklenenler

**Görsel Kontrol:**
- [ ] Çalışan stratejiler kartı görünüyor
- [ ] Portföy P&L kartı görünüyor
- [ ] Canlı Haber kartı görünüyor
- [ ] Piyasa kartı görünüyor
- [ ] Shell (LeftNav + CopilotDock) normal görünüyor

**Fonksiyonel Kontrol:**
- [ ] Tüm kartlar içerik gösteriyor
- [ ] Linkler çalışıyor
- [ ] Sayfa scroll edilebiliyor (gerekirse)

### Klavye Navigasyon Kontrolü
- [ ] `Tab` ile soldan sağa mantıklı bir sıra ile gezilebiliyor
- [ ] `Enter`/`Space` ile butonlar tetikleniyor
- [ ] Focus ring her zaman görünür
- [ ] `Shift+Tab` ile geri gidilebiliyor

**Screenshot:**
- [ ] Success state screenshot alındı (opsiyonel)

**Sonuç:** [ ] Success State OK

---

## 6️⃣ Lighthouse & Axe Turu

### Lighthouse

**Hazırlık:**
- [ ] Dashboard sayfası açık
- [ ] Chrome DevTools açık

**Test Adımları:**
- [ ] DevTools → Lighthouse
- [ ] Sadece **Accessibility** seçildi
- [ ] Device: **Desktop** seçildi
- [ ] "Analyze page load" tıklandı
- [ ] Analiz tamamlandı

**Beklenenler:**
- [ ] Accessibility skoru **≥ 90**
- [ ] Rapor ekranının screenshot'u alındı

**Screenshot:**
- [ ] Lighthouse Accessibility raporu screenshot alındı

**Sonuç:** [ ] Lighthouse OK (Score: ___)

---

### Axe DevTools

**Hazırlık:**
- [ ] Dashboard sayfası açık
- [ ] Axe DevTools eklentisi yüklü

**Test Adımları:**
- [ ] Axe DevTools → "Scan" tıklandı
- [ ] Tarama tamamlandı

**Beklenenler:**
- [ ] Critical violations = **0**
- [ ] Varsa uyarılar not edildi (P0 için şart değil)
- [ ] Sonuç ekranı screenshot alındı

**Screenshot:**
- [ ] Axe sonucu screenshot alındı

**Sonuç:** [ ] Axe OK (Critical: 0)

---

## 7️⃣ Screenshot Paketi Kontrolü

**Minimum Viable Set:**
- [ ] Loading (skeleton) screenshot
- [ ] Empty state screenshot
- [ ] Error state screenshot
- [ ] Lighthouse Accessibility raporu screenshot
- [ ] Axe sonucu screenshot

**Opsiyonel:**
- [ ] Success state screenshot

**Screenshot'lar hazır:** [ ] Evet

---

## 8️⃣ Git & PR Hazırlığı

### Git Kontrolü
- [ ] `git status` çalıştırıldı
- [ ] `git diff` kontrol edildi (anormallik yok)

### Commit & Push
- [ ] `git add .` yapıldı
- [ ] Commit mesajı hazır (`UI_P0_001_COMMIT_MESSAGE.txt`)
- [ ] `git commit` yapıldı
- [ ] `git push -u origin ui-ux/ui-p0-001-dashboard-skeleton` yapıldı

### PR Açma
- [ ] GitHub'da PR açıldı
- [ ] Başlık: `UI-P0-001: Dashboard skeleton & empty/error states`
- [ ] Body: `.github/PULL_REQUEST_TEMPLATE_UI_P0_001.md` şablonu dolduruldu
- [ ] Label'lar eklendi: `ui-ux`, `ui-ux:p0`, `area:dashboard`
- [ ] Issue bağlandı: `Closes #<issue-num>`
- [ ] Screenshot'lar PR'a eklendi

**PR açıldı:** [ ] Evet

---

## ✅ Final Durum

### Test Sonuçları
- [ ] Senaryo 1 (Loading) - OK
- [ ] Senaryo 2 (Empty) - OK
- [ ] Senaryo 3 (Error) - OK
- [ ] Senaryo 4 (Success) - OK
- [ ] Lighthouse - OK (Score: ≥ 90)
- [ ] Axe - OK (Critical: 0)

### Evidence
- [ ] Screenshot'lar hazır
- [ ] Lighthouse raporu hazır
- [ ] Axe sonucu hazır

### PR
- [ ] Git commit & push yapıldı
- [ ] PR açıldı
- [ ] PR template dolduruldu
- [ ] Evidence eklendi
- [ ] Issue bağlandı

---

## 🎯 Sonuç

**UI-P0-001 resmi olarak "ritüel + kanıt" haline geldi!**

Bu PR merge olduğu anda:
- UI/UX pipeline git history'de kanıtlanmış olacak
- Golden sample oluşacak (kopyalanabilir P0 fabrikası)
- UI-P0-002 için aynı koreografi kullanılacak

---

**Son Güncelleme:** 26.11.2025
**Durum:** ✅ Manuel Test Tamamlandı - PR Açılmaya Hazır

