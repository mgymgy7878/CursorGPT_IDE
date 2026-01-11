# 🔒 Kalıcı CSP ve Middleware Düzeltme Raporu

**Tarih:** 2025-12-25
**Durum:** ✅ KALICI ÇÖZÜM UYGULANDI
**Hedef:** "Çıplak HTML" regresyonunu önlemek

---

## 🎯 SORUN

CSS bazen yükleniyor bazen yüklenmiyor ("çıplak HTML" görünümü). Klasik kök nedenler:

1. **Middleware** `/_next/static/*` (CSS/JS) isteklerini yakalayıp redirect/rewrite ediyor
2. **CSP** dev'de HMR/webpack-hmr/websocket akışını engelliyor

---

## ✅ UYGULANAN KALICI ÇÖZÜMLER

### 1. Middleware Hard Bypass (Çifte Sigorta)

**Dosya:** `apps/web-next/middleware.ts`

**Değişiklik:**
- Matcher'a ek olarak kod içinde de hard bypass eklendi
- Asset'ler ve static dosyalar middleware'den tamamen dışarıda

**Önceki:**
```typescript
// Sadece matcher'a güveniyordu
if (pathname.startsWith('/_next/')) {
  return NextResponse.next();
}
```

**Yeni:**
```typescript
// Hard bypass: Next assetleri ve static dosyalar (regresyon koruması)
// Matcher'a ek olarak kod içinde de kontrol (çifte sigorta)
if (
  pathname.startsWith('/_next/') ||
  pathname.startsWith('/favicon') ||
  pathname === '/robots.txt' ||
  pathname === '/sitemap.xml' ||
  /\.(css|js|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname)
) {
  return NextResponse.next();
}
```

**Gerekçe:**
- Matcher yanlış olsa bile kod içinde koruma var
- Regex ile dosya uzantıları kontrol ediliyor
- Regresyon koruması sağlanıyor

### 2. CSP Dev Modunda Kapatıldı

**Dosya:** `apps/web-next/next.config.mjs`

**Değişiklik:**
- Dev modunda CSP header'ı hiç basılmıyor
- Production'da sıkı CSP korunuyor

**Gerekçe:**
- CSP güvenliği production'da anlamlı
- Dev'de HMR yüzünden sürekli "false negative" üretiyor
- Dev ergonomisi için CSP kapalı en az baş ağrısı

### 3. CSS Smoke Test Script'i

**Dosya:** `tools/css-smoke-test.ps1`

**Özellikler:**
- Dashboard HTML'inden CSS linklerini çeker
- Her CSS dosyasını kontrol eder:
  - Status 200 mü?
  - Content-Type text/css mi?
  - HTML içeriyor mu? (middleware redirect kontrolü)
- "Çıplak HTML" regresyonunu yakalar

**Kullanım:**
```powershell
pnpm smoke:css
# veya
powershell -NoProfile -ExecutionPolicy Bypass -File ./tools/css-smoke-test.ps1
```

**package.json'a eklendi:**
```json
"smoke:css": "powershell -NoProfile -ExecutionPolicy Bypass -File ./tools/css-smoke-test.ps1"
```

---

## 📋 DEĞİŞEN DOSYALAR

1. **apps/web-next/middleware.ts**
   - Hard bypass eklendi (asset'ler için)
   - Matcher güncellendi

2. **apps/web-next/next.config.mjs**
   - CSP dev modunda kapatıldı
   - Production CSP korunuyor

3. **tools/css-smoke-test.ps1** (yeni)
   - CSS yükleme smoke test'i
   - Regresyon yakalayıcı

4. **package.json**
   - `smoke:css` script'i eklendi

---

## 🔧 KANIT KONTROLÜ

### 1. DevTools Network Kontrolü

**CSS Dosyaları:**
- DevTools → Network → "CSS" filtrele
- `/_next/static/css/...` istekleri **200 OK** dönmeli
- Response Headers → `content-type: text/css` olmalı
- **301/302/307 redirect görülmemeli**

**Response Body Kontrolü:**
- Response body'nin başında `<!doctype html>` görülmemeli
- CSS içeriği görülmeli (`@tailwind`, `.spark-scroll` gibi)

### 2. PowerShell Smoke Test

```powershell
pnpm smoke:css
```

**Beklenen Çıktı:**
```
OK: TUM CSS DOSYALARI DOGRU YUKLENIYOR
   'Ciplak HTML' riski yok
```

### 3. Middleware Bypass Kontrolü

**Test:**
```powershell
# CSS dosyasına direkt istek
$r = Invoke-WebRequest "http://127.0.0.1:3003/_next/static/css/XXXX.css" -UseBasicParsing
$r.StatusCode  # 200 olmalı
$r.Headers["Content-Type"]  # text/css olmalı
$r.Content.Substring(0,20)  # HTML değil, CSS olmalı
```

---

## 🛡️ REGRESYON KORUMASI

### 1. Middleware Hard Bypass
- Matcher yanlış olsa bile kod içinde koruma var
- Regex ile dosya uzantıları kontrol ediliyor

### 2. CSS Smoke Test
- CI/CD pipeline'a eklenebilir
- Her build'de CSS yükleme kontrolü yapılır
- Regresyon anında yakalanır

### 3. CSP Dev/Prod Ayrımı
- Dev'de CSP kapalı (HMR sorunları yok)
- Prod'da sıkı CSP (güvenlik korunuyor)

---

## 📝 ÖZET

**Durum:** ✅ KALICI ÇÖZÜM UYGULANDI

**Yapılanlar:**
- ✅ Middleware hard bypass eklendi (çifte sigorta)
- ✅ CSP dev modunda kapatıldı
- ✅ CSS smoke test script'i eklendi
- ✅ package.json'a `smoke:css` script'i eklendi

**Koruma:**
- ✅ Middleware asset'lere dokunmuyor (hard bypass)
- ✅ CSP dev'de kapalı (HMR sorunları yok)
- ✅ Smoke test regresyonu yakalar

**Test:**
- Tarayıcıda hard refresh yapın (Ctrl+Shift+R)
- `pnpm smoke:css` çalıştırın
- DevTools Network'te CSS dosyalarını kontrol edin

---

## 🚀 SONRAKİ ADIMLAR

1. **CI/CD Pipeline'a Ekle:**
   ```yaml
   - name: CSS Smoke Test
     run: pnpm smoke:css
   ```

2. **Production Build Test:**
   - Production build'de CSP aktif olacak
   - Production'da test edilmeli

3. **Monitoring:**
   - CSS yükleme hatalarını logla
   - Alert mekanizması ekle

---

**Rapor Tarihi:** 2025-12-25
**Hazırlayan:** AI Assistant (Claude 4.1 Opus)
**Versiyon:** v1.3.2-SNAPSHOT

