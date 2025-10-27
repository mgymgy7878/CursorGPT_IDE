# SONRAKI OTURUM PLANI - Dashboard Sonrası

## 🎯 MEVCUT DURUM
**Dashboard tamamen çalışıyor** ✅
- URL: http://127.0.0.1:3003/dashboard
- Header navigation aktif
- KPI kartları görünüyor
- Server port 3003'te aktif

## 📋 ÖNCELİKLİ GÖREVLER

### 🔥 YÜKSEK ÖNCELİK (İlk 2 saat)

#### 1. Grafik Bileşeni Entegrasyonu
**Hedef**: Equity grafiği alanına gerçek grafik ekleme
- **Dosya**: `apps/web-next/components/dashboard/EquityChart.tsx`
- **Kütüphane**: `lightweight-charts@^4`
- **Durum**: Hazır alan mevcut, grafik eklenmeli

**Adımlar**:
```bash
# 1. Paket kurulumu
cd apps/web-next
pnpm add lightweight-charts@^4

# 2. Grafik bileşeni oluşturma
# 3. Dashboard'a entegrasyon
# 4. Test etme
```

#### 2. Backend Executor Servisi Düzeltme
**Hedef**: API veri bağlantısı için backend çalışır hale getirme
- **Dosyalar**: 
  - `services/executor/src/routes/ai.ts`
  - `services/executor/src/ai/index.ts`
  - `services/executor/src/ai/providers/index.ts`

**Bilinen Hatalar**:
- TypeScript TS2345 hataları
- require/import sorunları
- Cross-env komut sorunları

**Adımlar**:
```bash
# 1. TypeScript hatalarını düzeltme
# 2. Import/require sorunlarını çözme
# 3. Cross-env kurulumu
# 4. Servisi başlatma testi
```

### 🔶 ORTA ÖNCELİK (2-4 saat)

#### 3. API Veri Bağlantısı
**Hedef**: KPI kartlarını gerçek verilerle güncelleme
- **Endpoint**: `/api/public/health`, `/api/public/metrics`
- **Veriler**: Equity, P&L, pozisyonlar, risk

**Adımlar**:
```bash
# 1. API endpoint'lerini test etme
# 2. SWR ile veri çekme
# 3. KPI kartlarını güncelleme
# 4. Error handling ekleme
```

#### 4. Diğer Sayfaları Test Etme
**Hedef**: Navigation linklerinin çalıştığını doğrulama
- `/strategy-lab` - Strateji laboratuvarı
- `/strategies` - Strateji listesi
- `/orders` - Emirler
- `/positions` - Pozisyonlar

**Bilinen Sorunlar**:
- Eksik bileşenler
- Event-bus import sorunları
- Modal bileşenleri eksik

### 🔵 DÜŞÜK ÖNCELİK (4+ saat)

#### 5. WebSocket Bağlantıları
**Hedef**: Gerçek zamanlı veri akışı
- Live trading güncellemeleri
- Real-time KPI güncellemeleri

#### 6. Strateji Yönetimi
**Hedef**: Strateji oluşturma/düzenleme
- Backtest motoru entegrasyonu
- Strateji parametreleri

## 🛠️ TEKNİK DETAYLAR

### Çalışan Dosyalar (Yedeklenmiş)
```
backup/20250822-dashboard-success/
├── layout.tsx ✅
├── Header.tsx ✅
├── AppNav.tsx ✅
├── page.tsx ✅
├── tailwind.config.js ✅
└── backup_info.txt ✅
```

### Düzeltilmesi Gereken Dosyalar
```
services/executor/
├── src/routes/ai.ts ❌
├── src/ai/index.ts ❌
└── src/ai/providers/index.ts ❌
```

### Yeni Oluşturulacak Dosyalar
```
apps/web-next/
├── components/dashboard/
│   ├── EquityChart.tsx (yeni)
│   ├── KPIBar.tsx (güncellenecek)
│   └── TradingData.tsx (yeni)
└── lib/
    └── api.ts (güncellenecek)
```

## 🚀 BAŞLANGIÇ KOMUTLARI

### 1. Projeyi Başlatma
```bash
cd C:\dev\CursorGPT_IDE
pnpm --filter web-next dev
```

### 2. Backend Başlatma (düzeltildikten sonra)
```bash
cd C:\dev\CursorGPT_IDE
pnpm --filter executor dev
```

### 3. Grafik Paketi Kurulumu
```bash
cd apps/web-next
pnpm add lightweight-charts@^4
```

## 🎯 BAŞARI KRİTERLERİ

### Kısa Vadeli (Bu Oturum)
- [ ] Equity grafiği çalışıyor
- [ ] Backend executor servisi başlıyor
- [ ] API veri bağlantısı çalışıyor
- [ ] En az 2 sayfa test edildi

### Orta Vadeli (1 hafta)
- [ ] Tüm sayfalar çalışıyor
- [ ] WebSocket bağlantısı aktif
- [ ] Gerçek trading verileri görünüyor

## 🚨 POTANSİYEL SORUNLAR

### Grafik Entegrasyonu
- SSR/Client component sorunları
- lightweight-charts import sorunları
- Responsive tasarım sorunları

### Backend Düzeltmeleri
- TypeScript konfigürasyon sorunları
- ESM/CommonJS karışıklığı
- Port çakışmaları

### API Bağlantısı
- CORS sorunları
- Authentication sorunları
- Rate limiting

## 📞 ACİL DURUM PLANI

### Eğer Dashboard Bozulursa
1. `backup/20250822-dashboard-success/` klasöründen dosyaları geri yükle
2. `pnpm --filter web-next dev` ile test et
3. Sorun devam ederse cache temizle: `pnpm exec rimraf .next .turbo`

### Eğer Backend Çalışmazsa
1. TypeScript hatalarını tek tek düzelt
2. Import/require sorunlarını çöz
3. Gerekirse minimal backend ile başla

---
**Son Güncelleme**: 22 Ağustos 2025
**Hazırlayan**: Claude 3.5 Sonnet
**Durum**: Dashboard BAŞARILI ✅
**Sonraki Hedef**: Grafik + API entegrasyonu 