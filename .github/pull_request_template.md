# Pull Request Özeti

## Değişiklik Tanımı
<!-- PR'ın amacını kısa ve net bir şekilde açıklayın -->

## UX/Accessibility Kontrolü
- [ ] **UX-ACK**: Hangi Nielsen Norman veya WCAG 2.1 prensibi ile uyumlu?
  - [ ] NN/g: <!-- örn: Visibility of System Status, Error Prevention -->
  - [ ] WCAG: <!-- örn: 1.4.3 Contrast, 2.1.1 Keyboard -->
- [ ] **Evidence**: Kanıt dokümanları eklendi mi?
  - [ ] Lighthouse raporu (Performance ≥ 0.90, A11y ≥ 0.90)
  - [ ] Axe DevTools çıktısı (critical violations = 0)
  - [ ] Ekran görüntüsü (before/after)
  - [ ] Video/GIF (etkileşim akışları için)

## Teknik Kontrol
- [ ] Unit testler geçti (`pnpm test`)
- [ ] E2E testler geçti (`pnpm test:e2e`)
- [ ] Type check başarılı (`pnpm typecheck`)
- [ ] Linter temiz (`pnpm lint`)
- [ ] Bundle size kontrol edildi (< 250KB target)

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
