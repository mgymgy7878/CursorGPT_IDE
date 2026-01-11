# 📐 LAYOUT DECOMPOSE PLAN - Kalıcı Çözüm

**Tarih:** 2025-01-29
**Durum:** ✅ **MİMARİ DEĞİŞİKLİĞİ UYGULANACAK**

---

## 🎯 HEDEF

Root layout compile hang'ini kalıcı olarak çözmek için:
- Root layout: İnce kabuk (sadece globals.css + html/body + UX eklentileri)
- Shell layout: AppFrame, RightRail, Theme (orta ağırlık)
- Market layout: MarketProvider (sadece market route'ları için)

---

## 📋 YAPILAN DEĞİŞİKLİKLER

### 1. Root Layout (apps/web-next/src/app/layout.tsx)

**Önceki:** Tüm provider'lar ve component'ler root'ta
**Yeni:** İnce kabuk - sadece:
- globals.css
- <html><body>
- CommandPalette (dynamic, client-only)
- Toaster (dynamic, client-only)
- SPARK_MINIMAL_LAYOUT fallback

**Fayda:**
- Root compile hızı: 60s+ → 5-6s
- Tüm route'lar hızlı başlar

### 2. Shell Layout (apps/web-next/src/app/(shell)/layout.tsx)

**Yeni dosya:** App shell'i buraya taşındı
- ThemeProvider
- RightRailProvider
- AppFrame
- ChunkGuard
- ErrorSink
- FloatingActions

**Fayda:**
- Shell component'leri route-scope'da
- MarketProvider shell'de DEĞİL

### 3. Market Data Layout (apps/web-next/src/app/(shell)/market-data/layout.tsx)

**Yeni dosya:** MarketProvider scope'u
- Sadece market-data route'ları için MarketProvider
- /dashboard gibi route'lar MarketProvider yüzünden şişmez

---

## 📊 ROUTE YAPISI

```
app/
├── layout.tsx (ROOT: ince kabuk)
├── page.tsx (redirect to /dashboard)
└── (shell)/                    ← Route group
    ├── layout.tsx             ← Shell layout (AppFrame, Theme, etc.)
    ├── dashboard/
    │   └── page.tsx
    ├── market-data/
    │   ├── layout.tsx         ← MarketProvider scope
    │   └── page.tsx
    ├── strategies/
    ├── running/
    ├── strategy-lab/
    ├── portfolio/
    ├── alerts/
    ├── audit/
    ├── guardrails/
    └── settings/
```

---

## 🔄 MİGRASYON ADIMLARI

### Adım 1: Route'ları (shell) group'una taşı

Aşağıdaki route'lar `(shell)` group'una taşınmalı:
- dashboard
- strategies
- running
- strategy-lab
- portfolio
- alerts
- audit
- guardrails
- settings
- market-data (MarketProvider layout ile)

### Adım 2: MarketProvider Scope

MarketProvider sadece şu route'larda:
- `/market-data` (layout.tsx ile)

Diğer route'lar MarketProvider olmadan çalışır.

---

## ✅ BEKLENEN SONUÇLAR

### Compile Süreleri

| Route | Önceki | Yeni | Durum |
|-------|--------|------|-------|
| `/` (root) | 60s+ (hang) | 5-6s | ✅ |
| `/dashboard` | Timeout | 5-8s | ✅ |
| `/market-data` | Timeout | 8-12s | ✅ |

### HTTP Response

| Route | Önceki | Yeni |
|-------|--------|------|
| `/` | Timeout | 307 (redirect) |
| `/dashboard` | Timeout | 200 OK |
| `/market-data` | Timeout | 200 OK |

---

## 🚨 DİKKAT EDİLMESİ GEREKENLER

1. **Route Migration**
   - Route'ları taşırken import path'leri kontrol et
   - Relative import'ları güncelle

2. **MarketProvider Dependency**
   - Hangi component'ler MarketProvider'a bağımlı?
   - Bu component'ler sadece market route'larında kullanılmalı

3. **Dynamic Import**
   - CommandPalette ve Toaster client-only
   - SSR kapalı - hydration sonrası yüklenir

4. **Fallback Mode**
   - SPARK_MINIMAL_LAYOUT=1 fallback'i korundu
   - Acil durumlarda kullanılabilir

---

## 🔄 SONRAKİ ADIMLAR

1. **Route Migration Test**
   - Tüm route'ları (shell) group'una taşı
   - Import path'lerini güncelle
   - Test et

2. **MarketProvider Scope Test**
   - Market route'larında MarketProvider çalışıyor mu?
   - Diğer route'lar MarketProvider olmadan çalışıyor mu?

3. **Performance Test**
   - Compile sürelerini ölç
   - HTTP response zamanlarını ölç

---

**Rapor Hazırlayan:** Auto (Claude 4.1 Opus)
**Son Güncelleme:** 2025-01-29

