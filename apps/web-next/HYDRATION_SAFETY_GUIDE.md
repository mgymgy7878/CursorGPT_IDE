# 🛡️ HYDRATION SAFETY GUIDE

**Tarih:** 2025-01-15
**Amaç:** Next.js SSR/Client hydration mismatch'lerini önlemek

---

## 🎯 HEDEF

Next.js'te SSR (Server-Side Rendering) ve client hydration sırasında aynı HTML'i üretmek kritik. Render-time'da nondeterministic değerler kullanırsak, server ve client farklı sonuçlar üretir → **hydration mismatch hatası**.

---

## ❌ YAPILMAMASI GEREKENLER

### Render-time'da kullanılmaması gerekenler:

```tsx
// ❌ YANLIŞ - Her render'da farklı değer
<div>{new Date().toLocaleString('tr-TR')}</div>

// ❌ YANLIŞ - Her render'da farklı değer
<div>{Date.now()}</div>

// ❌ YANLIŞ - Her render'da farklı değer
<div>{Math.random()}</div>

// ❌ YANLIŞ - Her render'da farklı değer
<div>{crypto.randomUUID()}</div>
```

**Neden?**
- Server render: `01.01.2026 15:13:12`
- Client render: `01.01.2026 15:13:13` (1 saniye sonra)
- → Hydration mismatch! ❌

---

## ✅ DOĞRU YAKLAŞIMLAR

### 1. ClientTime / ClientDateTime Component'leri

```tsx
// ✅ DOĞRU - SSR-safe
import { ClientTime } from '@/components/common/ClientTime';

<div>
  Son test: <ClientTime format="datetime" />
</div>

// ✅ DOĞRU - Belirli bir timestamp için
<ClientTime value={timestamp} format="datetime" />
```

**Nasıl çalışır?**
- SSR'da: `"—"` placeholder render eder
- Mount sonrası: `useEffect` ile gerçek zamanı gösterir
- `suppressHydrationWarning` kullanır

### 2. useEffect ile State'e Yazma

```tsx
// ✅ DOĞRU - useEffect içinde
const [lastTest, setLastTest] = useState<string>('—');

useEffect(() => {
  setLastTest(new Date().toLocaleString('tr-TR'));
}, []);

<div>Son test: {lastTest}</div>
```

### 3. Event Handler'larda Kullanım

```tsx
// ✅ DOĞRU - Event handler içinde (render-time değil)
const handleTest = async () => {
  setTestResult({
    success: true,
    timestamp: new Date().toLocaleString('tr-TR'), // OK
  });
};
```

### 4. SSR-Safe Değerler

```tsx
// ✅ DOĞRU - Yıl değişmez, SSR-safe
<div>© {new Date().getFullYear()} Spark Trading</div>

// ✅ DOĞRU - typeof window kontrolü
{typeof window !== 'undefined'
  ? new Date(buildTime).toLocaleString('tr-TR')
  : buildTime}
```

---

## 🔍 TARAMA VE KONTROL

### Manuel Kontrol Listesi

1. **Hard Reload Test:**
   - `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
   - Console'da "Hydration failed" hatası olmamalı

2. **DevTools Console:**
   - "Text content does not match server-rendered HTML" hatası olmamalı
   - "Hydration failed" uyarısı olmamalı

3. **Kod Taraması:**
   ```bash
   # JSX içinde new Date() kullanımlarını bul
   grep -r "new Date()" apps/web-next/src --include="*.tsx" | grep -v "useEffect\|useState\|useCallback\|useMemo"

   # JSX içinde Date.now() kullanımlarını bul
   grep -r "Date.now()" apps/web-next/src --include="*.tsx" | grep -v "useEffect\|useState"

   # JSX içinde toLocaleString() kullanımlarını bul
   grep -r "toLocaleString" apps/web-next/src --include="*.tsx" | grep -v "useEffect\|useState"
   ```

### ESLint Kuralı (Öneri)

`.eslintrc.hydration-safety.js` dosyasını projeye ekleyin:

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    // ... diğer config'ler
    './.eslintrc.hydration-safety.js',
  ],
};
```

Bu kural şunları yakalar:
- JSX içinde `new Date()`
- JSX içinde `Date.now()`
- JSX içinde `Math.random()`
- JSX içinde `crypto.randomUUID()`
- JSX içinde `toLocaleString()`

---

## 📋 DÜZELTİLEN DOSYALAR

### ✅ Düzeltildi (2025-01-15)

1. **`apps/web-next/src/app/(shell)/settings/page.tsx`**
   - `Son test: {new Date().toLocaleString('tr-TR')}` → `<ClientTime format="datetime" />`
   - `{new Date(appSettings.lastUpdateCheck).toLocaleString('tr-TR')}` → `<ClientTime value={...} format="datetime" />`

2. **`apps/web-next/src/app/(shell)/control/page.tsx`**
   - `{new Date(canaryResult.timestamp).toLocaleString('tr-TR')}` → `<ClientTime value={...} format="datetime" />`

3. **`apps/web-next/src/components/common/BreachHistory.tsx`**
   - `{new Date(breach.timestamp).toLocaleTimeString('tr-TR')}` → `<ClientTime value={...} format="time" />`

### ✅ Zaten Güvenli

- Form component'lerindeki timestamp'ler event handler'larda state'e yazılıyor
- `VersionBanner.tsx`'teki `getFullYear()` SSR-safe (sadece yıl)
- `ClientDateTime.tsx` ve `ClientTime.tsx` component'leri doğru pattern kullanıyor

---

## 🚨 İLERİDE DİKKAT EDİLMESİ GEREKENLER

### Üst Bar Metrikleri

```tsx
// ⚠️ İleride dinamikleşirse dikkat!
<div>Son: 12s önce</div>
<div>P95: 45ms</div>
<div>RT Delay: 2ms</div>
```

**Çözüm:** Bu değerler dinamikleşirse `ClientTime` veya `useEffect` pattern'i kullanın.

### Relative Time Gösterimleri

```tsx
// ⚠️ "2m önce" gibi relative time'lar
<div>{formatRelativeTime(timestamp)}</div>
```

**Çözüm:** `ClientDateTime` component'ini `format="relative"` ile kullanın.

---

## 📚 REFERANSLAR

- [Next.js Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error)
- `apps/web-next/src/components/common/ClientTime.tsx` - SSR-safe time component
- `apps/web-next/src/components/ui/ClientDateTime.tsx` - SSR-safe datetime component

---

## ✅ TEST SONUÇLARI

- ✅ Typecheck: Başarılı
- ✅ Lint: Başarılı
- ✅ Hard Reload: Hydration hatası yok
- ✅ Console: "Hydration failed" uyarısı yok

