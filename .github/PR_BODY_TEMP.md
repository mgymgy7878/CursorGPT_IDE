## Amaç

GHA workflow'larını standardize ederek kırmızı job'ları canary modda yeşile çevirmek ve evidence akışını kurmak.

## Değişiklikler

### 1. Reusable Start Workflow
- `.github/workflows/_reusable-start.yml` oluşturuldu
- Ortak setup/build/wait bloğu (Node 20.11.1, pnpm 10.18.3)
- Tüm workflow'lar için tekrar kullanılabilir
- Health check retry mekanizması (pwsh, 120s)

### 2. Lighthouse CI (Canary)
- Stub'dan tam implementasyona yükseltildi
- `@lhci/cli@0.13.x` entegrasyonu
- `lighthouserc.json` budget config:
  - CLS <= 0.1
  - LCP <= 3.0s
  - FCP <= 2.0s
- `continue-on-error: true` (canary mod)
- Artifact upload: `.lighthouseci/**`, `lh-server.log`

### 3. Axe Accessibility (Canary)
- Stub'dan tam implementasyona yükseltildi
- `@axe-core/cli` entegrasyonu
- JSON reporter ile detaylı raporlama
- `continue-on-error: true` (canary mod)
- Artifact upload: `axe-results.json`, `axe-server.log`

### 4. Route Guard (Canary)
- Stub'dan tam implementasyona yükseltildi
- Kritik route testleri:
  - `/` (dashboard)
  - `/api/health`
  - `/api/public/metrics` (JSON + Prometheus)
- `continue-on-error: true` (canary mod)
- Artifact upload: route test sonuçları

### 5. Guard Validate (Fork Protection)
- Fork PR'lardan gelen çalıştırmaları engelleme:
  ```yaml
  if: ${{ !github.event.pull_request.head.repo.fork }}
  ```

### 6. CI Status Badges
- `docs/README.md`'ye 5 workflow rozeti eklendi
- Ana branch durumu görünür

## Evidence Akışı

Tüm workflow'lar şu artifact'leri yüklüyor:
- **Success cases**: job-specific evidence (7 gün retention)
- **Failure cases**: debug logs + build artefaktları (1 gün retention)

## Canary Mod Kriterleri

Şu anda tüm yeni job'lar `continue-on-error: true` ile çalışıyor. Enforce moduna geçiş için:

1. **Lighthouse**: 3 ardışık PR'da success
2. **Axe**: Violations < 10 ve 3 ardışık PR'da warning altında
3. **Route Guard**: 3 ardışık PR'da tüm rotalar 200

## Sıradaki Adımlar

1. Bu PR merge sonrası 3 PR boyunca canary evidence toplamak
2. Evidence analiz edip enforce moduna geçiş kararı vermek
3. Branch silme kararı: PR #29 revert ihtiyacı yoksa silinebilir

## Test Kanıtları

PR açıldıktan sonra workflow run linkleri buraya eklenecek:
- [ ] PR Smoke: [Run #__]()
- [ ] Lighthouse CI: [Run #__]()
- [ ] Axe: [Run #__]()
- [ ] Route Guard: [Run #__]()
- [ ] Guard Validate: [Run #__]()

