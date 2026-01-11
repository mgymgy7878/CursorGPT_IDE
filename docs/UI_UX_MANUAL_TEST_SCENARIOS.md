# UI/UX Manuel Test Senaryoları - UI-P0-001

Bu doküman, Dashboard skeleton & empty/error states için manuel test senaryolarını içerir.

---

## 🧪 Test Senaryoları

### 1. Loading / Skeleton Testi

**Hazırlık:**
```bash
pnpm --filter web-next dev
```

**Adımlar:**
1. Chrome DevTools → Network → Throttling: "Slow 3G" seç
2. Dashboard'a git: `http://127.0.0.1:3003/dashboard`
3. Sayfa yüklenirken gözlemle

**Beklenen:**
- ✅ LeftNav + CopilotDock her durumda görünür
- ✅ Ana alanda sadece skeleton kartları var (pulse animasyonu ile)
- ✅ `aria-busy="true"` main element'te var
- ✅ `aria-live="polite"` main element'te var
- ✅ Skeleton kartlar: Stratejiler, Portföy, Haber, Piyasa için placeholder'lar

**Kontrol:**
- Chrome DevTools → Elements → `[aria-busy="true"]` bulunmalı
- Chrome DevTools → Elements → `[aria-live="polite"]` bulunmalı

---

### 2. Empty State Testi

**Hazırlık:**
```bash
# API'yi boş liste döndürecek şekilde mock'la
# veya gerçekten stratejisi olmayan bir kullanıcı ile test et
```

**Yöntem 1: API Mock (Chrome DevTools)**
1. Chrome DevTools → Network → Request blocking
2. `/api/strategies/active` isteğini block et
3. Veya Network → Right click → Override content → Boş array döndür

**Yöntem 2: Gerçek Kullanıcı**
1. Stratejisi olmayan bir kullanıcı ile giriş yap
2. Dashboard'a git

**Beklenen:**
- ✅ Boş durum mesajı görünüyor: "Henüz strateji yok"
- ✅ Açıklayıcı metin görünüyor: "İlk stratejinizi oluşturarak başlayın..."
- ✅ "Strateji Oluştur" butonu görünüyor ve `/strategy-lab`'e götürüyor
- ✅ "Stratejileri Görüntüle" butonu görünüyor ve `/strategies`'e götürüyor
- ✅ Butonlar min 44×44px (WCAG 2.2 AA)
- ✅ Butonlarda `aria-label` var

**Klavye Navigasyonu:**
1. Tab tuşuna bas
2. Focus "Strateji Oluştur" butonuna gelmeli
3. Tab tuşuna tekrar bas
4. Focus "Stratejileri Görüntüle" butonuna gelmeli
5. Focus ring görünür olmalı

**Kontrol:**
- Chrome DevTools → Elements → `[aria-label*="Strateji Oluştur"]` bulunmalı
- Chrome DevTools → Accessibility → Tab order kontrolü

---

### 3. Error State Testi

**Hazırlık:**
```bash
# API'yi hata döndürecek şekilde mock'la
```

**Yöntem 1: Network Offline**
1. Chrome DevTools → Network → Offline seç
2. Dashboard'a git
3. Sayfa yenile

**Yöntem 2: API 500 Error**
1. Chrome DevTools → Network → Request blocking
2. `/api/strategies/active` ve `/api/portfolio/overview` isteklerini block et
3. Veya Network → Right click → Override content → 500 error döndür

**Beklenen:**
- ✅ Hata mesajı görünüyor: "Bir hata oluştu"
- ✅ Kullanıcı dostu açıklama görünüyor: "Veriler yüklenirken bir sorun oluştu."
- ✅ "Tekrar Dene" butonu görünüyor
- ✅ `role="alert"` hata mesajı container'ında var
- ✅ Alert icon (AlertCircle) görünüyor

**Retry Butonu Testi:**
1. Error state'te "Tekrar Dene" butonuna tıkla
2. State `loading` → `success` veya `error` döngüsüne girmeli
3. Eğer başarılı olursa normal dashboard görünmeli
4. Eğer hala hata varsa error state kalmalı

**Kontrol:**
- Chrome DevTools → Elements → `[role="alert"]` bulunmalı
- Chrome DevTools → Console → Error mesajları kontrol edilmeli

---

### 4. Success State Testi

**Hazırlık:**
```bash
# Normal API response ile test et
```

**Adımlar:**
1. Stratejisi olan bir kullanıcı ile giriş yap
2. Dashboard'a git
3. Normal dashboard içeriği görünmeli

**Beklenen:**
- ✅ "Çalışan Stratejiler" kartı görünüyor
- ✅ "Portföy P&L" kartı görünüyor
- ✅ "Canlı Haber" kartı görünüyor
- ✅ "Piyasa" kartı görünüyor
- ✅ Copilot dock görünüyor
- ✅ LeftNav görünüyor

---

## 🔍 Lighthouse Test

**Adımlar:**
1. Chrome DevTools → Lighthouse
2. Categories: Accessibility seç
3. Device: Desktop
4. "Analyze page load" tıkla

**Beklenen:**
- ✅ Accessibility Score: ≥ 90
- ✅ Performance Score: (opsiyonel) ≥ 80
- ✅ Best Practices Score: (opsiyonel) ≥ 90

**Kontrol:**
- Screenshot al ve PR'a ekle

---

## 🔍 Axe DevTools Test

**Adımlar:**
1. Chrome DevTools → Axe DevTools (extension gerekli)
2. "Scan" tıkla
3. Sonuçları kontrol et

**Beklenen:**
- ✅ Critical violations: 0
- ✅ Serious violations: 0 (tercihen)
- ✅ Moderate violations: (varsa not edilmeli)

**Kontrol:**
- Screenshot al ve PR'a ekle

---

## 📸 Screenshot Checklist

**Gereken Screenshot'lar:**

1. **Before:**
   - [ ] Mevcut durum (boş beyaz ekran - eğer varsa)

2. **After - Loading:**
   - [ ] Skeleton state (tüm kartlar skeleton)
   - [ ] Network throttling ile yavaş yükleme

3. **After - Empty:**
   - [ ] Boş durum ekranı (mesaj + butonlar)
   - [ ] Klavye focus ring görünür

4. **After - Error:**
   - [ ] Hata durumu (mesaj + retry butonu)
   - [ ] Network offline veya 500 error

5. **After - Success:**
   - [ ] Normal dashboard içeriği (opsiyonel)

6. **Lighthouse:**
   - [ ] Accessibility Score ≥ 90

7. **Axe:**
   - [ ] Critical violations = 0

---

## ✅ Test Sonuçları

### Loading State
- [ ] Skeleton görünüyor
- [ ] aria-busy/aria-live var
- [ ] Animasyon çalışıyor

### Empty State
- [ ] Mesaj görünüyor
- [ ] CTA butonları çalışıyor
- [ ] Klavye navigasyonu çalışıyor

### Error State
- [ ] Hata mesajı görünüyor
- [ ] Retry butonu çalışıyor
- [ ] role="alert" var

### Lighthouse
- [ ] Accessibility ≥ 90

### Axe
- [ ] Critical violations = 0

---

**Son Güncelleme:** 26.11.2025

