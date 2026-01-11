# Proje Analiz Protokolü

**Versiyon:** 1.0
**Durum:** Aktif
**Son Güncelleme:** 2025-01-29

---

## Amaç

Bu protokol, Spark Trading Platform projesinin tutarlı, tekrar üretilebilir ve kapsamlı analizlerini sağlamak için standart bir süreç tanımlar. Analiz sürecini sistematikleştirerek:

- **Tutarlılık:** Her analiz aynı yapı ve derinlikte
- **Tekrar Üretilebilirlik:** Aynı girdilerle aynı çıktılar
- **Kapsamlılık:** Hiçbir kritik alan atlanmaz
- **Kalite:** Standart kalite kapıları ile doğrulanmış çıktılar

---

## Protokol Akışı

```
┌─────────────────┐
│  Girdi Toplama  │ → Proje yapısı, teknoloji stack, dokümantasyon
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Haritalama    │ → Uygulamalar, servisler, API'ler, sayfalar
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Derin İnceleme  │ → Mimari, state, testler, CI/CD
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gap Analizi    │ → Eksikler, sorunlar, iyileştirmeler
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Kanıt Paketi   │ → Evidence dosyaları, kod örnekleri
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rapor Oluşturma │ → Şablon kullanarak rapor yazma
└─────────────────┘
```

---

## Adım 1: Girdi Toplama

### 1.1 Proje Yapısı

**Komutlar:**
```bash
# Root dizin yapısı
ls -la

# Workspace yapısı
cat pnpm-workspace.yaml

# Package.json
cat package.json
```

**Toplanacak Bilgiler:**
- Monorepo yapısı (apps/, services/, packages/)
- Workspace konfigürasyonu
- Root package.json scripts
- Dizin organizasyonu

### 1.2 Teknoloji Stack

**Komutlar:**
```bash
# Web-next teknolojileri
cat apps/web-next/package.json | grep -A 20 "dependencies"
cat apps/web-next/tsconfig.json
cat apps/web-next/next.config.mjs

# Executor teknolojileri
cat services/executor/package.json

# TypeScript versiyonu
cat package.json | grep typescript
```

**Toplanacak Bilgiler:**
- Framework versiyonları (Next.js, React, Fastify)
- State management (Zustand, SWR)
- UI kütüphaneleri (Tailwind, shadcn/ui)
- Test framework'leri (Jest, Playwright)
- Build araçları

### 1.3 Dokümantasyon

**Komutlar:**
```bash
# Docs dizini
ls -la docs/

# README dosyaları
find . -name "README.md" -type f

# Önemli dokümantasyonlar
ls docs/*.md | head -20
```

**Toplanacak Bilgiler:**
- Mevcut dokümantasyon dosyaları
- UI/UX standartları
- Mimari dokümantasyonu
- API dokümantasyonu

---

## Adım 2: Haritalama

### 2.1 Uygulamalar ve Servisler

**Komutlar:**
```bash
# Apps dizini
ls -la apps/

# Services dizini
ls -la services/

# Packages dizini
ls -la packages/
```

**Toplanacak Bilgiler:**
- Her app'in amacı ve port'u
- Her service'in amacı ve port'u
- Paylaşılan paketler ve amaçları

### 2.2 API Endpoints

**Komutlar:**
```bash
# Web-next API routes
find apps/web-next/src/app/api -name "route.ts" -type f

# Executor routes
find services/executor/src/routes -name "*.ts" -type f
```

**Toplanacak Bilgiler:**
- Tüm API endpoint'leri
- Route handler'ları
- Request/response formatları

### 2.3 Sayfa Yapısı

**Komutlar:**
```bash
# Next.js App Router sayfaları
find apps/web-next/src/app -name "page.tsx" -type f

# Layout dosyaları
find apps/web-next/src/app -name "layout.tsx" -type f
```

**Toplanacak Bilgiler:**
- Tüm sayfalar ve route'ları
- Layout yapısı
- Sayfa grupları (route groups)

### 2.4 Bileşenler

**Komutlar:**
```bash
# Component dosyaları
find apps/web-next/src/components -name "*.tsx" -type f | wc -l

# Component kategorileri
ls apps/web-next/src/components/
```

**Toplanacak Bilgiler:**
- Toplam component sayısı
- Component kategorileri
- Önemli component'ler

---

## Adım 3: Derin İnceleme

### 3.1 Mimari Desenler

**İncelenecek Dosyalar:**
- `apps/web-next/src/app/layout.tsx` - Root layout
- `apps/web-next/src/providers/MarketProvider.tsx` - WebSocket provider
- `services/executor/src/server.ts` - Fastify server

**Toplanacak Bilgiler:**
- Veri akışı (WebSocket → Provider → Store → UI)
- State management stratejisi
- Provider pattern kullanımı
- Server-side rendering stratejisi

### 3.2 State Management

**İncelenecek Dosyalar:**
- `apps/web-next/src/stores/` - Zustand stores
- `apps/web-next/src/hooks/` - Custom hooks

**Toplanacak Bilgiler:**
- Store yapısı ve amaçları
- Hook kullanımı
- Persistence stratejisi (localStorage)
- SWR kullanımı

### 3.3 Test Stratejisi

**Komutlar:**
```bash
# Test dosyaları
find apps/web-next/tests -name "*.ts" -type f
find apps/web-next/src -name "*.test.ts" -type f
find apps/web-next/src -name "*.spec.ts" -type f

# Test config
cat apps/web-next/playwright.config.ts
cat apps/web-next/jest.config.js
```

**Toplanacak Bilgiler:**
- Unit test sayısı ve coverage
- E2E test sayısı ve kapsamı
- Test framework konfigürasyonları
- Test stratejisi ve yaklaşımı

### 3.4 CI/CD

**Komutlar:**
```bash
# GitHub Actions workflows
ls -la .github/workflows/

# Workflow sayısı
ls .github/workflows/*.yml | wc -l
```

**Toplanacak Bilgiler:**
- Workflow sayısı ve amaçları
- Test otomasyonu
- Deployment stratejisi
- Quality gates

---

## Adım 4: Gap Analizi

### 4.1 Eksik Özellikler

**Kontrol Listesi:**
- [ ] Database layer (PostgreSQL + Prisma)
- [ ] Real trade execution
- [ ] BIST real-time feed
- [ ] Advanced AI features
- [ ] Multi-exchange support

### 4.2 Bilinen Sorunlar

**Kontrol Listesi:**
- [ ] Test coverage düşük mü?
- [ ] API endpoints mock mu?
- [ ] Error handling eksik mi?
- [ ] Performance sorunları var mı?
- [ ] Accessibility eksikleri var mı?

### 4.3 İyileştirme Alanları

**Kategoriler:**
- **Kritik:** Hemen yapılmalı
- **Yüksek:** Öncelikli
- **Orta:** Planlanmalı
- **Düşük:** İsteğe bağlı

---

## Adım 5: Kanıt Paketi

### 5.1 Evidence Dosyaları

**Konumlar:**
- `evidence/local/` - Yerel analiz kanıtları (proje yapısı, teknoloji stack, kod örnekleri)
- `evidence/ui/` - UI analiz kanıtları (ekran görüntüleri, component listeleri, sayfa yapıları)
- `docs/evidence/` - Dokümantasyon kanıtları (test sonuçları, metrikler, validation logları)
- `apps/web-next/_evidence/` - Web-next özel evidence (varsa)

**Toplanacak Dosyalar:**
- Kod snippet'leri (code reference formatında rapor içinde)
- Ekran görüntüleri (UI analizi için)
- Metrikler ve istatistikler (Prometheus, test coverage, vb.)
- Test sonuçları (Jest, Playwright)
- Komut çıktıları (proje yapısı, workspace analizi)

### 5.2 Kod Örnekleri

**Örnekler:**
- Önemli component'ler
- API route handler'ları
- Store implementasyonları
- Hook kullanımları

---

## Adım 6: Rapor Oluşturma

### 6.1 Şablon Kullanımı

**Şablon:** `docs/templates/PROJE_ANALIZ_RAPOR_SABLON.md`

**Adımlar:**
1. Şablonu kopyala
2. Dosya adını belirle: `PROJE_DETAYLI_ANALIZ_RAPORU_YYYY_MM_DD.md`
3. Tüm bölümleri doldur
4. Kanıt dosyalarını ekle
5. Linkleri kontrol et

### 6.2 Rapor Yapısı

**15 Ana Bölüm:**
1. Executive Summary
2. Proje Yapısı ve Mimari
3. Teknoloji Stack
4. Uygulamalar ve Servisler
5. Sayfalar ve Özellikler
6. State Management ve Veri Akışı
7. API Endpoints
8. Test Stratejisi
9. UI/UX Standartları
10. CI/CD ve Otomasyon
11. Monitoring ve Metrikler
12. Geliştirme Süreçleri
13. Kritik Dosyalar ve Konfigürasyonlar
14. Bilinen Sorunlar ve İyileştirme Alanları
15. Sonuç ve Öneriler

### 6.3 Kalite Kontrol

**Kontrol Listesi:**
- [ ] Tüm bölümler doldurulmuş mu?
- [ ] Kod örnekleri doğru mu?
- [ ] Linkler çalışıyor mu?
- [ ] Türkçe dil kurallarına uygun mu?
- [ ] Teknik terimler doğru mu?
- [ ] Tarih ve versiyon bilgileri güncel mi?

---

## Örnek Komutlar

### Hızlı Analiz Başlangıcı

**Windows PowerShell:**
```powershell
# Proje yapısı (tree komutu yoksa Get-ChildItem kullan)
Get-ChildItem -Directory -Depth 1 | Select-Object Name

# Package.json analizi (jq yoksa ConvertFrom-Json kullan)
Get-Content package.json | ConvertFrom-Json | Select-Object scripts, dependencies, devDependencies

# Workspace paketleri
pnpm list --depth=0

# TypeScript dosya sayısı
(Get-ChildItem -Recurse -Include *.ts,*.tsx | Measure-Object).Count

# Test dosya sayısı
(Get-ChildItem -Recurse -Include *.test.ts,*.spec.ts | Measure-Object).Count
```

**Linux/macOS:**
```bash
# Proje yapısı
tree -L 2 -I 'node_modules|dist|.next'

# Package.json analizi
cat package.json | jq '.scripts, .dependencies, .devDependencies'

# Workspace paketleri
pnpm list --depth=0

# TypeScript dosya sayısı
find . -name "*.ts" -o -name "*.tsx" | wc -l

# Test dosya sayısı
find . -name "*.test.ts" -o -name "*.spec.ts" | wc -l
```

### Detaylı Analiz

**Windows PowerShell:**
```powershell
# Web-next analizi
cd apps/web-next
(Get-ChildItem -Recurse -Path src -File | Measure-Object).Count
(Get-ChildItem -Recurse -Path src/components -File | Measure-Object).Count
(Get-ChildItem -Recurse -Path src/app -Filter page.tsx | Measure-Object).Count

# Executor analizi
cd ..\..\services\executor
(Get-ChildItem -Recurse -Path src -File | Measure-Object).Count
Get-Content package.json | ConvertFrom-Json | Select-Object -ExpandProperty dependencies

# CI/CD analizi
cd ..\..\.github\workflows
(Get-ChildItem -Filter *.yml | Measure-Object).Count
```

**Linux/macOS:**
```bash
# Web-next analizi
cd apps/web-next
find src -type f | wc -l
find src/components -type f | wc -l
find src/app -name "page.tsx" | wc -l

# Executor analizi
cd ../../services/executor
find src -type f | wc -l
cat package.json | jq '.dependencies'

# CI/CD analizi
cd ../../.github/workflows
ls *.yml | wc -l
```

---

## Evidence Klasör Yapısı

```
evidence/
├── local/                          # Yerel analiz kanıtları
│   ├── proje_yapisi.txt           # Monorepo yapısı, workspace config
│   ├── teknoloji_stack.txt        # Package.json analizi, versiyonlar
│   ├── kod_ornekleri/             # Önemli kod snippet'leri
│   └── komut_ciktilari/           # Komut çıktıları (tree, find, vb.)
├── ui/                             # UI analiz kanıtları
│   ├── sayfa_listesi.txt          # Tüm sayfalar ve route'lar
│   ├── component_listesi.txt      # Component kategorileri
│   ├── ekran_goruntuleri/         # UI screenshot'ları
│   └── layout_yapisi.txt          # Layout hiyerarşisi
└── analiz/                         # Analiz çıktıları
    ├── gap_analizi.txt            # Eksik özellikler
    ├── sorunlar.txt               # Bilinen sorunlar
    └── oneriler.txt               # İyileştirme önerileri

docs/evidence/                      # Dokümantasyon kanıtları
├── dev/                           # Development evidence
│   └── [versiyon]/                # Versiyon bazlı kanıtlar
├── prod/                          # Production evidence
│   └── [versiyon]/                # Production kanıtları
└── [kategori]/                    # Kategori bazlı kanıtlar
    └── [timestamp]/                # Zaman damgalı kanıtlar
```

---

## Referanslar

- **Rapor Şablonu:** `docs/templates/PROJE_ANALIZ_RAPOR_SABLON.md`
- **Örnek Rapor:** `PROJE_DETAYLI_ANALIZ_RAPORU_2025_01_29.md`
- **UI/UX Standartları:** `docs/UI_UX_TALIMATLAR_VE_PLAN.md`
- **Mimari:** `docs/ARCHITECTURE.md`

---

## Notlar

- Protokol her analiz için aynı şekilde uygulanmalıdır
- Evidence dosyaları analiz sırasında toplanmalıdır
- Rapor şablonu mutlaka kullanılmalıdır
- Kalite kapıları kontrol edilmeden rapor tamamlanmamalıdır

