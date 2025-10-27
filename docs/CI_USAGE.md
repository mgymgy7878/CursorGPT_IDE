# CI/CD Kullanım Kılavuzu

## Genel Bakış

Spark Trading projesi, kod kalitesi ve kullanıcı deneyimini garanti altına almak için otomatik CI/CD pipeline'ları kullanır.

## CI Pipeline'ları

### 1. **Node Modules Guard** (`block-node-modules.yml`)

**Amaç:** PR'larda yanlışlıkla `node_modules/` dizininin eklenmesini engeller.

**Tetikleyici:** Her PR (opened, synchronize, reopened)

**Başarı Kriteri:**
- ✅ Değişiklik setinde `node_modules/` dizini yok

**Başarısızlık Durumu:**
```bash
❌ node_modules detected in PR - please remove it
```

**Çözüm:**
```bash
git rm -r --cached node_modules/
git commit --amend
git push --force-with-lease
```

---

### 2. **Lighthouse CI** (`lighthouse-ci.yml`)

**Amaç:** Performance ve accessibility skorlarının minimum eşikleri geçmesini sağlar.

**Tetikleyici:** `apps/web-next/**` veya `packages/**` değişikliği içeren PR'lar

**Test Edilen Sayfalar:**
- `/` (Anasayfa)
- `/portfolio`
- `/strategies`
- `/settings`

**Başarı Kriterleri:**
- ✅ Performance Score ≥ 0.90 (90%)
- ✅ Accessibility Score ≥ 0.90 (90%)
- ⚠️  Unused JavaScript: warn only
- ⚠️  Total Bundle Size < 250 KB: warn only

**Konfigürasyon:** `.lighthouserc.json`

**Lokal Test:**
```bash
# 1. Dev server'ı başlat
pnpm --filter web-next dev -- --port 3003

# 2. Başka terminalde Lighthouse çalıştır
npm i -g @lhci/cli
lhci autorun --config=.lighthouserc.json
```

**Skor Düşerse Ne Yapmalı?**

| Kategori | Olası Nedenler | Çözümler |
|----------|----------------|----------|
| Performance | Büyük bundle, render blocking | Dynamic imports, code splitting, image optimization |
| Accessibility | Kontrast, aria labels, keyboard | Axe DevTools kullan, WCAG 2.1 AA'ya uy |

---

### 3. **Axe Accessibility Tests** (`axe-a11y.yml`)

**Amaç:** WCAG 2.1 AA uyumluluğunu otomatik test eder.

**Tetikleyici:** `apps/web-next/**` veya `tests/a11y/**` değişikliği içeren PR'lar

**Test Kapsamı:**
- 6 core page (/, /portfolio, /strategies, /running, /strategy-lab, /settings)
- WCAG 2.1 Level A ve AA kuralları
- Critical ve serious violations = 0 hedefi

**Lokal Test:**
```bash
# 1. Dev server'ı başlat
pnpm --filter web-next dev -- --port 3003

# 2. Axe testlerini çalıştır
pnpm exec playwright test tests/a11y/axe.spec.ts
```

**Violation Bulunursa:**
1. Test çıktısında violation ID ve açıklama gösterilir
2. `helpUrl` linkinden detaylı fix kılavuzuna ulaşabilirsiniz
3. Axe DevTools browser extension ile manuel doğrulama yapın

**Örnek Violation:**

```
[CRITICAL] color-contrast
Elements must have sufficient color contrast
Help: https://dequeuniversity.com/rules/axe/4.8/color-contrast
Affected nodes: 2
  - <button class="status-pill">Offline</button>
```

**Fix:**
```css
.status-pill {
  /* Önce: */
  background: #666;
  color: #999;
  
  /* Sonra (4.5:1 kontrast): */
  background: #333;
  color: #fff;
}
```

---

## PR Template Gereksinimleri

`.github/PULL_REQUEST_TEMPLATE.md` kullanarak her PR şu bilgileri içermelidir:

### Zorunlu Checklist'ler:

1. **UX-ACK**: Nielsen Norman veya WCAG prensibi belirtilmeli
   ```
   ✅ WCAG 1.4.3 Contrast (Minimum)
   ✅ NN/g: Visibility of System Status
   ```

2. **Evidence**: En az birini ekleyin
   - Lighthouse raporu (screenshot veya JSON)
   - Axe DevTools çıktısı
   - Before/after ekran görüntüsü
   - Etkileşim videosu

3. **Rollback Planı**: Sorun çıkarsa ne yapılacak?
   ```
   Feature flag ENABLE_NEW_PORTFOLIO kapatılacak
   API rollback ile 5 dakikada eski versiyona dönülebilir
   ```

4. **Hijyen**:
   - [ ] node_modules eklenmedi
   - [ ] Console.log temizlendi
   - [ ] Secret'lar commit edilmedi

---

## Threshold'ları Güncelleme

### Lighthouse Skorlarını Değiştirme

`.lighthouserc.json` dosyasını düzenleyin:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],  // 90 → 85'e düştü
        "categories:accessibility": ["error", {"minScore": 0.95}]  // 90 → 95'e çıktı
      }
    }
  }
}
```

### Axe Test Kapsamını Genişletme

`tests/a11y/axe.spec.ts` içindeki `PAGES` array'ine yeni sayfa ekleyin:

```ts
const PAGES = [
  { path: "/", name: "Anasayfa" },
  { path: "/new-page", name: "Yeni Sayfa" },  // ← Eklendi
];
```

---

## Path Filter Kuralları

CI'lar sadece ilgili dosyalar değiştiğinde çalışır. **Örnek:**

### Lighthouse CI Path Filter:
```yaml
paths:
  - 'apps/web-next/**'      # Frontend değişiklikleri
  - 'packages/**'           # Shared packages
  - '.lighthouserc.json'    # Config değişiklikleri
```

**Çalışmaz:** Backend/executor, docs, scripts değişiklikleri

### Axe Path Filter:
```yaml
paths:
  - 'apps/web-next/**'
  - 'tests/a11y/**'
```

**Path filter bypass etmek için:**
```yaml
on:
  pull_request:  # paths: kısmını kaldırın
```

---

## Troubleshooting

### "Dev server timeout" hatası
```
Error: Server did not respond after 10s
```

**Çözüm:**
```yaml
- name: Start dev server
  run: |
    pnpm --filter web-next dev -- --port 3003 &
    sleep 15  # 10 → 15 saniyeye çıkar
```

### "Playwright browser not found"
```
Error: chromium not found
```

**Çözüm:**
```bash
pnpm exec playwright install --with-deps
```

### Lighthouse "PROTOCOL_TIMEOUT"
```
Error: Lighthouse couldn't connect to Chrome
```

**Çözüm:**
```bash
# Next.js production build kullan (dev server yerine)
pnpm -w -r build
pnpm --filter web-next start -p 3003 &
```

---

## İleri Seviye

### 1. **Canary Deployment ile Entegrasyon**

PR merge olduktan sonra otomatik canary deploy:

```yaml
# .github/workflows/canary-deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: |
          # 10% trafik canary'ye
          kubectl set image deployment/spark-web web=spark:${{ github.sha }} -n canary
          kubectl patch deployment spark-web -n canary -p '{"spec":{"replicas":1}}'
```

### 2. **Real User Monitoring (RUM)**

Lighthouse CI sonuçlarını trend olarak kaydet:

```bash
# Lighthouse CI Server kurulumu
npm i -g @lhci/server
lhci server --storage.storageMethod=sql --storage.sqlDatabasePath=./lhci.db
```

---

## Best Practices

1. **Her PR'da CI geçsin:** Merge etmeden önce tüm check'ler ✅
2. **Evidence ekleyin:** Screenshot ve raporlar reviewer'a yardımcı olur
3. **Threshold'ları düşürmeyin:** Performance/a11y hedeflerini savunun
4. **Lokal test edin:** CI'da debug yapmak zaman kaybıdır
5. **Path filter kullanın:** İlgisiz değişikliklerde CI çalışmasın

---

## İlgili Dökümanlar

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lighthouse Scoring Calculator](https://googlechrome.github.io/lighthouse/scorecalc/)
- [Axe Rules Reference](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Nielsen Norman Group Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

---

**Son güncelleme:** 2025-10-27  
**Maintainer:** Spark Trading Team

