# CI Runbook - Spark Trading Platform

## Genel Bakış

Bu doküman Spark Trading Platform'un CI/CD pipeline'ını ve yerel geliştirme ortamını açıklar.

## CI Pipeline

### Tek Akış CI
```bash
pnpm run ci
```

Bu komut şu adımları sırayla çalıştırır:
1. **Typecheck** - Tüm TypeScript dosyalarını kontrol eder
2. **Lint** - ESLint ile kod kalitesi kontrolü
3. **Test** - Jest ile unit testler
4. **Build** - Tüm paketleri derler

### GitHub Actions Workflow

`.github/workflows/ci.yml` dosyası şu adımları içerir:

1. **Secret Guard** - gitleaks v8.18.4 ile güvenlik taraması
2. **Typecheck** - TypeScript kontrolü
3. **Lint** - ESLint kontrolü
4. **Test** - Jest testleri
5. **Build** - Derleme
6. **Artifact Upload** - Runtime logları yedekleme

## Yerel Geliştirme

### Kurulum
```bash
pnpm install
```

### CI Zinciri Test
```bash
# Tüm adımları test et
pnpm run ci

# Tek tek test et
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

### Yerel Kanıt Toplama

#### Windows
```bash
# Root cause analizi
.\runtime\ui_root_cause_logs.cmd

# Panel ve executor başlatma
.\runtime\boot_panel_and_executor.cmd
```

#### Linux/Mac
```bash
# Root cause analizi
./runtime/ui_root_cause_logs.sh

# Panel ve executor başlatma
./runtime/boot_panel_and_executor.sh
```

## Sık Karşılaşılan Hatalar

### ESLint Hataları
- **Problem**: `--ext` flag'i ESLint 9.x'te kaldırıldı
- **Çözüm**: Script'lerde `eslint src` kullanın (ext otomatik algılanır)

### Jest ES Modules
- **Problem**: ES modules ile Jest uyumsuzluğu
- **Çözüm**: `jest.config.cjs` kullanın ve `transform` konfigürasyonu ekleyin

### Import Path Sorunları
- **Problem**: `@spark/*` import'ları çözülemiyor
- **Çözüm**: `tsconfig.base.json`'da paths'leri kontrol edin

### Build Hataları
- **Problem**: Next.js build'de module bulunamıyor
- **Çözüm**: Package.json'da workspace dependencies'i kontrol edin

## SARIF Görüntüleme

GitHub'da Security tab'ında SARIF raporlarını görüntüleyebilirsiniz:

1. Repository'de **Security** tab'ına gidin
2. **Code scanning alerts** bölümünde gitleaks sonuçlarını görün
3. Detaylı rapor için **View SARIF** link'ine tıklayın

## Branch Protection

Ana branch'lerde şu check'ler required olmalı:
- Secret Guard
- Typecheck
- Lint
- Test
- Build

## Release Öncesi Kontroller

Release öncesi şu adımları takip edin:

1. **Green Gate**: Day-2..6 smoke script'lerinden en az biri PASS
2. **Metrics**: Prometheus metrikleri görünür olmalı
3. **Health Check**: `/api/public/health` endpoint'i çalışmalı

## Performans Optimizasyonları

### Cache Kullanımı
- pnpm store cache aktif
- Next.js build cache aktif
- Jest cache aktif

### Paralel İşlemler
- `pnpm -r --parallel` ile workspace'ler paralel çalışır
- CI'da tüm adımlar paralel yürütülür

## Monitoring

### Runtime Logları
- `runtime/logs/` altında timestamp'li dosyalar
- Port durumları, process listesi, API yanıtları

### Metrics
- Prometheus endpoint: `/api/public/metrics/prom`
- Grafana dashboard'ları: `ops/grafana/dashboards/`

## Troubleshooting

### CI Başarısız
1. Yerel olarak `pnpm run ci` çalıştırın
2. Runtime loglarını kontrol edin
3. Import path'lerini doğrulayın

### Build Başarısız
1. `pnpm clean` ile temizlik yapın
2. `pnpm install` ile yeniden kurulum
3. TypeScript hatalarını düzeltin

### Test Başarısız
1. Jest konfigürasyonunu kontrol edin
2. ES modules uyumluluğunu doğrulayın
3. Import path'lerini test edin

## İletişim

Sorunlar için:
- GitHub Issues kullanın
- Runtime loglarını ekleyin
- CI artifact'larını paylaşın 