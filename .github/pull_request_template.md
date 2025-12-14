# Pull Request Özeti

## Değişiklik Tanımı

<!-- PR'ın amacını kısa ve net bir şekilde açıklayın -->

## UX/Accessibility Kontrolü

### UX-ACK (Required)

Hangi Nielsen Norman veya WCAG 2.1 prensibi ile uyumlu?

**WCAG 2.1 Compliance:**

- [ ] **1.4.3 Contrast (Minimum)**: Tüm metinler ≥4.5:1 kontrast oranı
- [ ] **2.1.1 Keyboard**: Tüm interaktif elementler klavye ile erişilebilir
- [ ] **3.3.2 Labels or Instructions**: Form input'ları proper `<label>` ilişkili
- [ ] **4.1.2 Name, Role, Value**: ARIA attributes doğru kullanıldı
- [ ] **4.1.3 Status Messages**: Canlı bölgeler için `role="status"` + `aria-live`

**Nielsen Norman Group:**

- [ ] **Visibility of System Status**: Kullanıcı sistemin durumunu her zaman görür
- [ ] **Error Prevention**: Destructive action'lar confirmation ister
- [ ] **Recognition Rather Than Recall**: Net etiketler, görsel hiyerarşi

### Evidence (Required)

Kanıt dokümanları eklendi mi?

- [ ] **Lighthouse Raporu**: CI artifacts link veya JSON summary
  - [ ] Performance Score ≥ 0.90
  - [ ] Accessibility Score ≥ 0.90
  - [ ] 5 sayfa test edildi (/, /portfolio, /strategies, /running, /settings)
- [ ] **Axe DevTools**: Critical violations = 0 screenshot'u
- [ ] **Page Screenshots**: Etkilenen tüm sayfalar (before/after)
- [ ] **Bundle Size**: Initial load < 250KB (build output)
- [ ] **Smoke Test**: `pwsh scripts/smoke-ui.ps1` passed

## Teknik Kontrol

- [ ] Unit testler geçti (`pnpm test`)
- [ ] E2E testler geçti (`pnpm test:e2e`)
- [ ] Type check başarılı (`pnpm typecheck`)
- [ ] Linter temiz (`pnpm lint`)
- [ ] Bundle size kontrol edildi (< 250KB target)
- [ ] **PR Smoke CI geçti** (`pr-smoke.yml` workflow)
  - ❌ **CI fail oldu mu?** → [RCA Decision Tree](docs/CI/PR_SMOKE_RCA_DECISION_TREE.md) + [FigJam Diyagram](https://www.figma.com/make/f2XWaKovyFbvyKMjpJ5qwv/AI-Trading-App?node-id=0-1&t=lXNUBjllEELmcCm3-1) ile 1-2 dakikada sınıflandır
    > **Not:** FigJam linkini almak için: FigJam'de diyagram sayfasını aç → Share → Copy link (view erişimi yeterli). `<FIGJAM_LINKINIZ>` placeholder'ını gerçek link ile değiştirin.

## Güvenlik ve Risk

- [ ] **Rollback Planı**: Sorun çıkarsa geri alma adımları
  - <!-- örn: Feature flag kapanacak, ENV değişkeni eski değere dönecek -->
- [ ] Breaking change var mı? **Evet / Hayır**
- [ ] Database migration gerekli mi? **Evet / Hayır**
- [ ] API contract değişikliği var mı? **Evet / Hayır**

## Dokümantasyon

- [ ] README.md güncellendi (gerekiyorsa)
- [ ] API_REFERENCE.md güncellendi (gerekiyorsa)
- [ ] CHANGELOG.md'ye eklendi
- [ ] Inline code comment'lar eklendi (karmaşık logic için)

## Hijyen Kontrolleri

- [ ] `node_modules/` eklenmedi (CI guard otomatik kontrol eder)
- [ ] `.env` veya secret'lar commit edilmedi
- [ ] Console.log/debug kodları temizlendi
- [ ] TODO comment'lar issue'ya dönüştürüldü

## Deployment Notu

<!-- Production deployment öncesi dikkat edilmesi gerekenler -->

- **ENV değişkenleri**: <!-- örn: BINANCE_API_URL production'da set edilmeli -->
- **Canary stratejisi**: <!-- örn: %10 trafik → 24h bekle → %100 -->
- **İlk gözlem noktaları**: <!-- örn: /api/health, P95 latency, error rate -->

---

### Reviewer için notlar

<!-- Code review yapan kişiye özel bilgi, test senaryoları, manuel test adımları -->
