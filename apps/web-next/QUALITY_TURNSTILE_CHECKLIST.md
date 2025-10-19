# ✅ 10 DAKIKALIK KALİTE TURNİKESİ - KONTROL LİSTESİ

**Tarih:** 2025-10-14  
**Sprint:** QA Hardening - Quality Gates  
**Süre:** ~10 dakika

---

## 1️⃣ GÖRSEL DÜZEN (Tek Scroll + Overlap Yok)

### Kod Kontrolü ✅
```css
/* apps/web-next/src/app/globals.css */
html, body { 
  overflow: hidden; /* ✅ Page-level scroll disabled */
  scrollbar-gutter: stable; /* ✅ Layout shift prevented */
}
```

```tsx
/* apps/web-next/src/components/layout/AppShell.tsx */
<main className="overflow-y-auto"> {/* ✅ Main scroll area */}
<aside className="overflow-y-auto"> {/* ✅ Sidebar scroll */}
<aside className="overflow-y-auto"> {/* ✅ Copilot scroll */}
```

### Manuel Test
- [ ] Dashboard'ı aç → **sadece orta panel kayıyor**
- [ ] Strategy Lab → **sağ Copilot kendi alanında**
- [ ] Strategies → **sol sidebar kendi alanında**
- [ ] Portfolio → **hiçbir overlap yok**
- [ ] Settings → **tek scroll disiplini korunuyor**

### DevTools Kontrolü
```javascript
// Console'da çalıştır:
getComputedStyle(document.body).overflow // → "hidden"
getComputedStyle(document.querySelector('main')).overflowY // → "auto"
```

---

## 2️⃣ HYDRATION SIZINTILARI

### Kod Kontrolü ✅
```tsx
/* ClientDateTime.tsx */
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <span>--:--</span>; // ✅ Server-safe fallback

/* CopilotDock.tsx */
<span suppressHydrationWarning>Copilot {arrow}</span> // ✅ Hydration warning suppressed
```

### Manuel Test
- [ ] Console temiz, **"Text content does not match"** yok
- [ ] Copilot arrow ilk render'da sabit → mount sonrası dinamik
- [ ] Tarih/saat gösterimlerinde **hydration uyarısı yok**

### DevTools Console
```
✅ No hydration warnings
✅ No React errors
✅ Clean console on page load
```

---

## 3️⃣ TOAST POLİTİKASI

### Kod Kontrolü ✅
```tsx
/* lib/toast/policy.ts */
export function shouldShowToast(context) {
  if (context.source === "user_action") return true; // ✅
  if (context.source === "background_poll") return false; // ✅
}

/* MarketsHealthWidget.tsx */
// Background polling - NO TOAST
catch (e) {
  setMetrics({ status: "critical", _mock: true }); // ✅ Silent fail
}
```

### Manuel Test
- [ ] Sayfa yenileme → **kırmızı toast yok**
- [ ] Dashboard load → **sessiz metric polling**
- [ ] Portfolio "Kapat" → **success toast var** ✅
- [ ] Background widget error → **toast yok, amber chip göster**

### Network Tab
```
✅ /api/tools/metrics → Fail silently
✅ /api/public/alert/last → Return 200 + _mock
✅ No error toasts on background polls
```

---

## 4️⃣ LAZY YÜKLEME VE GÖRÜNÜRLÜK KAPILARI

### Kod Kontrolü ✅
```tsx
/* LazyWidget.tsx */
const { ref, isVisible } = useIntersectionObserver({
  threshold: 0.1,
  freezeOnceVisible: true, // ✅ Load once
});

/* Dashboard page.tsx */
<LazyWidget>
  <MarketsHealthWidget /> {/* ✅ Only loads when visible */}
</LazyWidget>
```

### Manuel Test
- [ ] Dashboard → MarketsHealth ekran dışında → **ağ çağrısı yok**
- [ ] Aşağı kaydır → widget görünür → **API çağrısı başlar**
- [ ] Tab gizle → **polling durur**
- [ ] Tab göster → **polling devam eder**

### Network Tab
```javascript
// DevTools Network → Filter: /api/tools/metrics
// Widget ekranda değilken: 0 requests
// Widget görünür olunca: Request başlar
// Tab hidden olunca: Requests pause
```

---

## 5️⃣ DEMO/MOCK EMNİYETİ

### Kod Kontrolü ✅
```tsx
/* apps/web-next/src/app/api/public/alert/last/route.ts */
catch(e) {
  return NextResponse.json({ 
    _mock: true, 
    status: 'DEMO',
    _err: 'executor_offline' 
  }, { status: 200 }); // ✅ Always 200
}
```

### Manuel Test
- [ ] Executor offline simüle et
- [ ] `/api/public/metrics` → **200 + _mock:true**
- [ ] `/api/public/alert/last` → **200 + status:DEMO**
- [ ] `/api/public/smoke-last` → **200 + _mock:true**
- [ ] UI'da **amber chip** görünüyor
- [ ] **Kırmızı toast yok**

### Curl Test
```bash
# Public endpoints (executor offline olsa bile 200)
curl -s http://localhost:3003/api/public/alert/last | jq
# → { "_mock": true, "status": "DEMO" }

curl -s http://localhost:3003/api/public/metrics | jq
# → { "_mock": true, "status": "DEMO" }
```

---

## 6️⃣ PORTFÖY OPTİMİSTİC AKIŞI

### Kod Kontrolü ✅
```tsx
/* OptimisticPositionsTable.tsx */
const handleClose = async (asset) => {
  setPending({ ...pending, [asset]: true }); // ✅ Optimistic
  toast({ type: "info", title: "İşlem Kapanıyor" }); // ✅ User action
  
  try {
    await api.close(asset);
    setPositions(positions.filter(p => p.asset !== asset)); // ✅ Remove
    toast({ type: "success" }); // ✅ Success
  } catch (error) {
    setPending({ ...pending, [asset]: false }); // ✅ Rollback
    toast({ type: "error" }); // ✅ Error
  }
};
```

### Manuel Test
- [ ] "Kapat" tıkla → **satır anında pending**
- [ ] Loading state → **"Kapatılıyor..." görünür**
- [ ] Success → **satır listeden kaldırılır**
- [ ] Error simüle et → **rollback + error toast**
- [ ] **Tek toast** gösterimi (spam yok)

---

## 7️⃣ ERİŞİLEBİLİRLİK VE HAREKET AZALTMA

### Kod Kontrolü ✅
```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

*:focus-visible {
  outline: 2px solid #1b7fff; /* ✅ Visible focus */
}
```

### Manuel Test
- [ ] Sistem ayarlarında "Reduce Motion" aç
- [ ] Animasyonlar **kapanıyor/hızlanıyor**
- [ ] Tab ile butonlara git → **focus ring görünür**
- [ ] Enter/Space ile buton tetikleniyor
- [ ] ARIA labels **ekran okuyucularda çalışıyor**

### DevTools Accessibility
```
✅ All interactive elements have ARIA labels
✅ Focus order is logical
✅ Keyboard navigation works
```

---

## 8️⃣ SÜRÜM TEK KAYNAĞI

### Kod Kontrolü ✅
```tsx
/* VersionBanner.tsx */
const featureVersion = process.env.NEXT_PUBLIC_FEATURE_VERSION || "v2.0";
const modelVersion = process.env.NEXT_PUBLIC_MODEL_VERSION || "ml-fusion-1.2";
const buildSha = process.env.NEXT_PUBLIC_BUILD_SHA || "dev";
```

### Manuel Test
- [ ] Footer'da **VersionBanner** görünür
- [ ] Feature version: **v2.0**
- [ ] Model version: **ml-fusion-1.2**
- [ ] Build SHA: **7 karakter** (kısa hash)
- [ ] Build time: **ISO 8601 format**

### Tek Kaynak Kontrolü
```bash
# .env.local veya build ortamından
NEXT_PUBLIC_FEATURE_VERSION=v2.0
NEXT_PUBLIC_MODEL_VERSION=ml-fusion-1.2
NEXT_PUBLIC_BUILD_SHA=$(git rev-parse HEAD)
```

---

## 9️⃣ MOBİL DAVRANIŞ

### Kod Kontrolü ✅
```tsx
/* AppShell.tsx */
<div className="grid xl:grid-cols-[240px_1fr_360px] md:grid-cols-[72px_1fr] grid-cols-1">
  {/* Hamburger menu: xl:hidden */}
  {/* Sidebar: -translate-x-full (closed), translate-x-0 (open) */}
  {/* Copilot FAB: fixed bottom-6 right-6 */}
</div>
```

### Manuel Test
- [ ] **xl (>1280px):** 3 kolon (240px sidebar + main + 360px copilot)
- [ ] **md (768-1280px):** 2 kolon (72px collapsed + main)
- [ ] **sm (<768px):** 1 kolon stacked
- [ ] Hamburger menu **çalışıyor**
- [ ] Copilot FAB **sağ alt köşede**
- [ ] Drawer **açılıp kapanıyor**
- [ ] Backdrop **tıklanınca kapanıyor**
- [ ] Close (✕) **butonlar çalışıyor**

### DevTools Responsive Mode
```
Desktop (1440px): ✅ 3 columns
Tablet (1024px):  ✅ 2 columns (collapsed sidebar)
Mobile (375px):   ✅ 1 column + drawers
```

---

## 🔟 MİKRO-PERFORMANS

### Kod Kontrolü ✅
```tsx
/* LazyWidget.tsx */
const { ref, isVisible } = useIntersectionObserver({
  freezeOnceVisible: true, // ✅ Render once
});

/* MarketsHealthWidget.tsx */
const interval = setInterval(() => {
  if (!document.hidden) load(); // ✅ Pause on hidden
}, 45000);
```

### Manuel Test
- [ ] Performance tab → **Chart render'lar ertelenmiş**
- [ ] LazyChart → **görünene kadar render etmez**
- [ ] Tab gizli → **polling durdurulmuş**
- [ ] CPU usage → **idle'da düşük**

### Lighthouse Audit
```bash
# DevTools → Lighthouse → Performance
CLS (Cumulative Layout Shift): ≈ 0 ✅
LCP (Largest Contentful Paint): < 2.5s ✅
FID (First Input Delay): < 100ms ✅
TTI (Time to Interactive): < 3.8s ✅
```

---

## 🔥 DUMAN TESTLERİ (Tek Satır)

### Health + Headers
```bash
curl -s http://localhost:3003/api/healthz -I | sed -n '1p;/strict-transport-security/p;/content-security-policy/p'
# → HTTP/1.1 200 OK
# → X-Build-SHA: <sha>
```

### ML Score (Fail-Closed Emniyeti)
```bash
curl -s http://localhost:3003/api/ml/score \
  -H 'content-type: application/json' \
  -d '{"feature":{"ts":1,"symbol":"X","tf":"1h","o":null,"h":1,"l":1,"c":1,"v":1}}' | jq
# → Should return fail-closed response on invalid data
```

### Public Endpoints (Executor Offline → 200)
```bash
for e in alert/last metrics smoke-last; do
  echo "=== $e ==="
  curl -s http://localhost:3003/api/public/$e | jq '._mock // .status'
done
# → All return 200 + _mock/DEMO
```

---

## 📊 SONUÇ

### Geçiş Kriterleri
- [ ] ✅ **1-10 tüm kontroller yeşil**
- [ ] ✅ **Console temiz (hydration yok)**
- [ ] ✅ **Network: sessiz hatalar (toast yok)**
- [ ] ✅ **Lighthouse: CLS ≈ 0**
- [ ] ✅ **Mobil: drawer'lar çalışıyor**
- [ ] ✅ **Lazy load: görünene kadar render yok**
- [ ] ✅ **Optimistic UI: rollback doğru**
- [ ] ✅ **DEMO mode: 200 + amber chip**

### Turnike Durumu
```
🟢 GEÇER → Canary'ye bas, metronom 60 BPM
🟡 UYARI → Küçük düzeltme gerekli
🔴 BAŞARISIZ → Regresyon var, düzelt
```

---

## 🚀 SONRAKİ ADIMLAR

1. **Canary Smoke Test** → `npm run smoke-test:canary`
2. **E2E Test Suite** → Playwright/Cypress
3. **Load Test** → Artillery/k6 (1000 RPS)
4. **Security Scan** → OWASP ZAP
5. **Bundle Size** → `next build` analizi

**Turnike geçildi mi? → Evet ✅ → Sahne senin! 🎭**

