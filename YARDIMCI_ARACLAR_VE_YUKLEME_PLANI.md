# Yardımcı Araçlar ve Yükleme Planı

**Tarih:** 2025-01-20
**Durum:** 📋 Öneriler Hazırlandı

---

## ✅ MEVCUT ARAÇLAR

Kullanıcı sisteminde mevcut olanlar:
- ✅ **Docker Desktop** - Containerization için hazır
- ✅ **Python** - Scripting ve data processing için hazır
- ✅ **GitHub** - Version control için hazır
- ✅ **Node.js v20.10.0** - Portable binary (tools/node-v20.10.0-win-x64/node.exe)
- ✅ **pnpm 10.18.3** - Package manager aktif

---

## 🛠️ ÖNERİLEN YENİ ARAÇLAR

### 1. Geliştirme Araçları

#### Storybook (Component Dokümantasyonu)

**Amaç:** UI bileşenlerini dokümante etmek ve izole geliştirmek

**Yükleme:**
```bash
cd apps/web-next
pnpm add -D @storybook/react @storybook/react-webpack5 @storybook/addon-essentials @storybook/addon-interactions @storybook/addon-a11y
```

**Kurulum:**
```bash
pnpm exec storybook init
```

**Kullanım:**
```bash
pnpm storybook  # Storybook başlatır
```

**Avantajlar:**
- Component'leri izole geliştirme
- Visual regression testing
- Accessibility testing (a11y addon)
- Dokümantasyon otomatik oluşturma

---

#### Bundle Analyzer (Bundle Size Analizi)

**Amaç:** Bundle size'ı optimize etmek ve gereksiz kodları tespit etmek

**Yükleme:**
```bash
pnpm -w add -D @next/bundle-analyzer
```

**Kullanım:**
`apps/web-next/next.config.mjs` dosyasına ekle:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = withBundleAnalyzer({
  // ... mevcut config
});
```

**Script ekle:** `apps/web-next/package.json`
```json
{
  "scripts": {
    "analyze": "ANALYZE=true pnpm build"
  }
}
```

**Kullanım:**
```bash
pnpm --filter web-next analyze
```

---

### 2. Code Quality Araçları

#### ESLint Import Plugin

**Amaç:** Import'ları sıralamak ve organize etmek

**Yükleme:**
```bash
pnpm -w add -D eslint-plugin-import
```

**Konfigürasyon:** `apps/web-next/eslint.config.js`
```javascript
import importPlugin from 'eslint-plugin-import';

export default {
  plugins: {
    import: importPlugin,
  },
  rules: {
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    }],
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'warn',
  },
};
```

---

#### Prettier Tailwind Plugin

**Amaç:** Tailwind class'larını otomatik sıralamak

**Yükleme:**
```bash
pnpm -w add -D prettier-plugin-tailwindcss
```

**Konfigürasyon:** `.prettierrc` veya `package.json`
```json
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "apps/web-next/tailwind.config.ts"
}
```

**Kullanım:**
```bash
pnpm -w format  # Tüm dosyaları formatlar
```

---

### 3. Testing Araçları

#### Playwright Visual Testing

**Amaç:** Visual regression testing

**Mevcut:** Playwright zaten yüklü ✅

**Yapılandırma:**
`apps/web-next/playwright.config.ts` dosyasına ekle:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      threshold: 0.2, // Pixel diff threshold
    },
  },
});
```

**Kullanım:**
```bash
pnpm --filter web-next test:e2e
```

---

### 4. Monitoring Araçları

#### Lighthouse CI

**Amaç:** Performance, accessibility, SEO skorlarını otomatik ölçmek

**Yükleme:**
```bash
pnpm -w add -D @lhci/cli
```

**Konfigürasyon:** `lighthouserc.json` (zaten mevcut)
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3003"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

**Kullanım:**
```bash
pnpm --filter web-next lhci autorun
```

---

### 5. Docker Araçları

#### Docker Compose (Mevcut)

**Amaç:** Development environment containerization

**Mevcut:** `docker-compose.yml` dosyası var ✅

**İyileştirme Önerileri:**
1. Hot reload için volume mount'ları kontrol et
2. Health check'leri ekle
3. Environment variable'ları `.env` dosyasından oku

---

### 6. CI/CD Araçları

#### GitHub Actions Workflows

**Mevcut:** GitHub yüklü ✅

**Önerilen Workflow'lar:**

##### `.github/workflows/ci.yml`
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm -w install
      - run: pnpm -w typecheck
      - run: pnpm -w lint
      - run: pnpm --filter web-next test:e2e
```

##### `.github/workflows/performance.yml`
```yaml
name: Performance
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm -w install
      - run: pnpm --filter web-next build
      - run: pnpm --filter web-next start &
      - run: pnpm --filter web-next lhci autorun
```

---

### 7. Python Araçları (Mevcut Python kullanılarak)

#### Data Processing Scripts

**Amaç:** Market data processing ve analiz

**Örnek Kullanım:**
```python
# tools/data-processor.py
import pandas as pd
import numpy as np

def process_market_data(data):
    # Market data processing logic
    pass
```

---

## 📦 TÜM YÜKLEME KOMUTLARI (Toplu)

Tek seferde tüm araçları yüklemek için:

```bash
# Root dizininde
cd C:\dev\CursorGPT_IDE

# 1. Storybook
cd apps/web-next
pnpm add -D @storybook/react @storybook/react-webpack5 @storybook/addon-essentials @storybook/addon-interactions @storybook/addon-a11y

# 2. Bundle Analyzer
cd ../..
pnpm -w add -D @next/bundle-analyzer

# 3. ESLint Import Plugin
pnpm -w add -D eslint-plugin-import

# 4. Prettier Tailwind Plugin
pnpm -w add -D prettier-plugin-tailwindcss

# 5. Lighthouse CI
pnpm -w add -D @lhci/cli

# Storybook init (ilk kurulum)
cd apps/web-next
pnpm exec storybook init --yes
```

---

## 🚀 HIZLI BAŞLANGIÇ

### 1. Gerekli Araçları Yükle (5 dakika)

```bash
# Root dizinde
cd C:\dev\CursorGPT_IDE

# Storybook
cd apps/web-next && pnpm add -D @storybook/react @storybook/react-webpack5 @storybook/addon-essentials && cd ../..

# Diğer araçlar
pnpm -w add -D @next/bundle-analyzer eslint-plugin-import prettier-plugin-tailwindcss @lhci/cli

# Storybook init
cd apps/web-next && pnpm exec storybook init --yes && cd ../..
```

### 2. Konfigürasyonları Güncelle

- [ ] ESLint config'e import plugin ekle
- [ ] Prettier config'e tailwind plugin ekle
- [ ] next.config.mjs'e bundle analyzer ekle
- [ ] Storybook config'i kontrol et

### 3. Test Et

```bash
# Storybook
cd apps/web-next && pnpm storybook

# Bundle analyzer
cd ../.. && pnpm --filter web-next analyze

# Lighthouse
pnpm --filter web-next lhci autorun
```

---

## 📋 ÖNCELİK SIRASI

### Yüksek Öncelik (Bu Hafta)

1. ✅ **Prettier Tailwind Plugin** - Tailwind class sıralama
2. ✅ **ESLint Import Plugin** - Import organizasyonu
3. ✅ **Bundle Analyzer** - Bundle size optimizasyonu

### Orta Öncelik (Bu Ay)

4. **Storybook** - Component dokümantasyonu
5. **Lighthouse CI** - Performance monitoring
6. **GitHub Actions** - CI/CD pipeline

### Düşük Öncelik (Gelecek)

7. **Python Scripts** - Data processing
8. **Docker Compose Improvements** - Development environment

---

## 🎯 SONUÇ

Bu araçlar projenin kalitesini, bakımını ve geliştirme hızını önemli ölçüde artıracaktır. Öncelik sırasına göre kademeli olarak yüklenebilir.

**İlk Adım:** Yüksek öncelikli 3 aracı yükle ve konfigürasyonları güncelle.

---

**Hazırlayan:** Auto (Cursor AI Assistant)
**Tarih:** 2025-01-20

