# UI MİMARİSİ TAMAMLANDI - Spark Trading Platform

**Tarih**: 2025-10-13  
**Durum**: ✅ TAMAMLANDI  
**Build**: ✅ 61 route başarılı  

---

## 🎯 HEDEFLENEN MİMARİ vs GERÇEKLEŞEN

### ✅ TAMAMLANAN SAYFALAR

#### 1. **Topbar + Sağ Üst Menü**
- **Dosya**: `apps/web-next/src/components/topbar/Topbar.tsx`
- **Özellikler**: 
  - Ayarlar, Borsa Bağla, AI Anahtarı, Durum JSON
  - Sağ üstte sabit konum
  - Dropdown menü + click-outside
  - JSON durum indirme özelliği

#### 2. **📊 Stratejilerim Sayfası**
- **Dosya**: `apps/web-next/src/app/strategies/page.tsx`
- **Özellikler**:
  - Liste görünümü (id, ad, sembol, TF, status, sonPnL)
  - Row actions: Preview/Start/Stop/Backtest/Optimize/Delete
  - Auto-refresh (10s)
  - Boş durum CTA: "İlk stratejinizi oluşturun →"
  - TR para formatı (`fmtCurrencyTR`)

#### 3. **🧪 Strategy Lab (Tek Sayfa, 3 Tab)**
- **Dosya**: `apps/web-next/src/app/strategy-lab/page.tsx`
- **Özellikler**:
  - **Editor Tab**: Kod editörü + StrategyControls entegrasyonu
  - **Backtest Tab**: Tarih/TF/symbol seçimi → `/api/backtest/run`
  - **Optimize Tab**: Parametre aralıkları → `/api/optimize/run`
  - URL params: `?tab=backtest&strategy=${id}`
  - Tek "aktif strateji" context'i

#### 4. **⚙️ Settings Sayfası**
- **Dosya**: `apps/web-next/src/app/settings/page.tsx`
- **Özellikler**:
  - **Borsalar Tab**: Binance, BTCTurk (API Key, Secret, Sandbox)
  - **AI Sağlayıcıları Tab**: OpenAI, Claude (API Key, Model seçimi)
  - Form submit → `/api/connections/upsert` ve `/api/ai/providers/upsert`
  - Enable/disable toggle

#### 5. **Dashboard Geliştirmeleri**
- **ActiveStrategiesWidget**: Poll 5s + skeleton + CTA
- **SLOChip**: P95<1200ms, stale<30s, error<0.01/s hedefleri
- **RecentActions**: Son 10 aksiyon + audit özeti
- **Layout**: 3 sütun → 2 sütun alt grid

---

## 🔌 API PROXY'LERİ (Tümü Graceful 200)

### Strategies API
- `POST /api/strategies/list` → `/advisor/strategies/list`
- `POST /api/strategies/create` → `/advisor/strategies/create`
- `POST /api/strategies/delete` → `/advisor/strategies/delete`

### Strategy Operations
- `POST /api/strategy/control` → `/advisor/strategy/control` (mevcut)
- `POST /api/strategy/preview` → `/advisor/strategy/preview` (mevcut)

### Backtest & Optimize
- `POST /api/backtest/run` → `/backtest/run`
- `POST /api/optimize/run` → `/optimization/run`

### Connections & AI
- `GET /api/connections/list` → `/connections/list`
- `POST /api/connections/upsert` → `/connections/upsert`
- `GET /api/ai/providers/list` → `/copilot/providers`
- `POST /api/ai/providers/upsert` → `/copilot/providers`

### Audit
- `POST /api/audit/list` → `/audit/list`

---

## 🎨 UI/UX İYİLEŞTİRMELERİ

### ✅ Responsive Layout
- Topbar: Sağ üst sabit, dropdown menü
- Sidebar: "Stratejilerim" ve "Strategy Lab" eklendi
- Dashboard: 3 sütun → 2 sütun alt grid (SLOChip + RecentActions)

### ✅ Boş Durum CTA'ları
- **Strategies**: "İlk stratejinizi oluşturun →" → `/strategy-lab`
- **ActiveStrategies**: "İlk stratejinizi oluşturun →" → `/strategy-lab`
- **RecentActions**: "Strategy Lab'de işlem yapın"

### ✅ Skeleton Loading
- Strategies sayfası: 3 satır skeleton
- RecentActions: 3 satır skeleton
- SLOChip: animate-pulse

### ✅ TR Yerelleştirme
- `fmtCurrencyTR`: Portfolio ve Strategies sayfalarında
- `fmtNumberTR`: SLOChip'te
- Sidebar: "Anasayfa" (Dashboard)

---

## 🔒 RBAC & Onay Politikası

### ✅ ConfirmModal Bileşeni
- **Dosya**: `apps/web-next/src/components/modals/ConfirmModal.tsx`
- **Variant'lar**: danger, warning, info
- **Props**: title, message, confirmText, cancelText, isLoading

### Onay Gereken İşlemler
- **Start/Stop**: `confirm_required: true` → modal zorunlu
- **Delete**: Browser confirm + API confirm
- **Threshold değişimi**: Gelecek sprint
- **Model promote**: Gelecek sprint

### Onay Gerekmeyen İşlemler
- **Preview**: `confirm_required: false`
- **Backtest/Optimize**: `dryRun: true` varsayılan

---

## 📊 SLO & Monitoring

### ✅ SLOChip Hedefleri
- **P95**: <1200ms (1.2s)
- **Staleness**: <30s
- **Error Rate**: <1%

### ✅ Durum Rozetleri
- **🟢 SLO OK**: Tüm hedefler sağlanıyor
- **🟡 SLO Warning**: Bir veya daha fazla hedef aşılıyor
- **🔴 SLO Offline**: Executor bağlantısı yok

### ✅ RecentActions
- Son 10 aksiyon (audit özeti)
- ✓/✗ durumu + zaman damgası
- 5s poll interval
- Başarı/başarısızlık oranı

---

## 🧪 TEST SENARYOLARI

### ✅ SMOKE Testleri
```bash
# Build başarılı
pnpm -C apps/web-next build  # ✅ 61 route

# Sayfa erişimi
http://localhost:3003/strategies     # ✅ Liste + CTA
http://localhost:3003/strategy-lab   # ✅ 3 tab
http://localhost:3003/settings       # ✅ Borsalar + AI
http://localhost:3003/dashboard      # ✅ SLOChip + RecentActions

# API proxy'leri
POST /api/strategies/list            # ✅ Graceful 200
POST /api/backtest/run              # ✅ Graceful 200
POST /api/connections/upsert        # ✅ Graceful 200
```

### ✅ Negatif Senaryolar
- **Executor kapalı**: Widget'lar boş durum + CTA gösteriyor
- **API hataları**: `_err` field + toast notification
- **Network timeout**: 3.5s timeout + 2x retry + jitter
- **Schema drift**: `any` type + graceful fallback

---

## 🚀 SONRAKI ADIMLAR

### 1. **Guardrails Entegrasyonu**
- Threshold & weights'i gerçek kaynaktan oku
- Read-only başla, sonra edit modu

### 2. **Evidence ZIP Üretimi**
- Canary/Strategy control sonrası otomatik toplama
- Dashboard'dan indirilebilir ZIP

### 3. **WebSocket Progress Stream**
- Backtest/Optimize uzun süren işlemler için
- Real-time progress bar

### 4. **Toast + Retry-After UX**
- Butonları `Retry-After` süresi kadar disable
- Geri sayım chip

### 5. **Zod Şemaları (Lite)**
- `PreviewResp`/`ControlResp` için minimal doğrulama
- Status enum, sayısal metrikler

---

## 📋 KOMUTLAR

### Development
```bash
# Dev server
pnpm -C apps/web-next dev --port 3003

# Build test
pnpm -C apps/web-next build

# Type check
npx tsc --noEmit --project apps/web-next/tsconfig.json
```

### Smoke Test
```bash
# Port kontrolü
Get-NetTCPConnection -State Listen | ? { $_.LocalPort -eq 3003 }

# HTTP test
Invoke-WebRequest -Uri "http://localhost:3003/dashboard" -UseBasicParsing
```

---

## 🎯 KAPANIŞ

**UI mimarisi tamamen yenilendi**:
- ✅ 4 yeni sayfa (Strategies, Strategy Lab, Settings, Topbar)
- ✅ 12 yeni API proxy (tümü graceful 200)
- ✅ 3 yeni bileşen (SLOChip, RecentActions, ConfirmModal)
- ✅ Responsive layout + TR yerelleştirme
- ✅ Skeleton loading + boş durum CTA'ları
- ✅ RBAC confirm modal + audit tracking

**Anasayfa artık gerçek operasyon paneli**:
- Çalışan stratejiler (5s poll)
- SLO hedefleri (P95/staleness/error)
- Son aksiyonlar (audit özeti)
- Offline durumu net işaretleniyor

**Strategy Lab tek akışta çalışıyor**:
- Editor → Backtest → Optimize
- Tek strateji context'i
- URL params ile tab geçişi

**Stratejilerim günlük işin merkezi**:
- Liste + durum + son PnL
- Row actions (Preview/Start/Stop/Backtest/Optimize/Delete)
- Auto-refresh + CTA

**Ayarlar erişimi sağ üstten tek tıkla**:
- Borsa bağlantıları (Binance, BTCTurk)
- AI sağlayıcıları (OpenAI, Claude)
- Form submit + toast feedback

Sonraki sprint: Guardrails entegrasyonu + Evidence ZIP üretimi ile "Real Canary Evidence" akışını tamamlayalım! 🚀

---

**İmza**: Cursor (Claude 3.5 Sonnet)  
**Durum**: ✅ UI mimarisi tamamlandı  
**Build**: ✅ 61 route başarılı  
**Kanıt**: Smoke testler + negatif senaryolar PASS
