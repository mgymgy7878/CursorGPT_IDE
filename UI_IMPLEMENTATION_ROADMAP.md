# cursor (Claude 3.5 Sonnet): UI IMPLEMENTATION ROADMAP

**Tarih**: 9 Ekim 2025  
**Durum**: Strategy Lab ✅ Tamamlandı → Sıradaki Adımlar  
**Hedef**: Tam işlevsel Spark Trading Platform UI

---

## 📊 MEVCUT DURUM

### Tamamlanan ✅
- [x] Strategy Lab (Monaco + Copilot + Results)
- [x] /api/exec/backtest endpoint
- [x] /api/copilot/chat endpoint (mevcut)
- [x] Temel dashboard layout (boş)
- [x] Navigation yapısı

### Eksik ❌
- [ ] Ana Dashboard (gerçek veri)
- [ ] Stratejilerim sayfası
- [ ] Çalışan Stratejiler
- [ ] Portföy sayfası
- [ ] Ayarlar sayfası
- [ ] Çoğu API entegrasyonu

---

## 🎯 6 ADIMDA TAM FONKSİYONEL UI

### ADIM 1: ANA DASHBOARD (Öncelik: YÜKSEK)
**Süre**: 2-3 saat  
**Hedef**: Kullanıcı giriş yaptığında anlamlı bir dashboard görsün

#### Dosyalar
```
apps/web-next/src/
├── app/(dashboard)/page.tsx           ← Güncelle (şu an boş)
├── components/dashboard/
│   ├── ServiceHealthGrid.tsx          ← Yeni
│   ├── KeyMetricsGrid.tsx            ← Yeni
│   └── QuickStats.tsx                ← Yeni
└── app/api/
    ├── services/health/route.ts       ← Yeni
    └── metrics/summary/route.ts       ← Yeni
```

#### API Endpoint'leri
```typescript
// 1. Service Health Check
GET /api/services/health
Response: {
  executor: { ok: true, port: 4001 },
  ml: { ok: false, error: "..." },
  ...
}

// 2. Platform Metrics
GET /api/metrics/summary
Response: {
  activeStrategies: 3,
  totalTrades: 156,
  dailyPnL: +250,
  systemUptime: "99.8%"
}
```

#### Bileşenler

**ServiceHealthGrid.tsx**
```tsx
'use client';
import { Card, Badge, Grid } from '@tremor/react';
import { useHealth } from '@/hooks/useHealth';

export function ServiceHealthGrid() {
  const { health } = useHealth(); // SWR hook
  
  const services = [
    { name: 'Executor', key: 'executor', port: 4001 },
    { name: 'ML Engine', key: 'ml', port: 4010 },
    { name: 'Streams', key: 'streams', port: 4002 },
  ];
  
  return (
    <Grid numItemsMd={2} numItemsLg={3} className="gap-4">
      {services.map(s => (
        <Card key={s.key}>
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-gray-500">Port {s.port}</p>
            </div>
            <Badge color={health?.[s.key]?.ok ? 'green' : 'red'}>
              {health?.[s.key]?.ok ? 'Çalışıyor' : 'Kapalı'}
            </Badge>
          </div>
        </Card>
      ))}
    </Grid>
  );
}
```

**KeyMetricsGrid.tsx**
```tsx
'use client';
import { Card, Metric, Text } from '@tremor/react';
import { TrendingUp, Activity, DollarSign } from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';

export function KeyMetricsGrid() {
  const { metrics } = useMetrics();
  
  return (
    <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
      <MetricCard
        title="Aktif Stratejiler"
        value={metrics?.activeStrategies || 0}
        icon={<Activity />}
      />
      <MetricCard
        title="Günlük İşlem"
        value={metrics?.totalTrades || 0}
        icon={<TrendingUp />}
      />
      <MetricCard
        title="Günlük P/L"
        value={`${metrics?.dailyPnL > 0 ? '+' : ''}${metrics?.dailyPnL || 0} USD`}
        icon={<DollarSign />}
        color={metrics?.dailyPnL > 0 ? 'green' : 'red'}
      />
    </Grid>
  );
}
```

**Ana Dashboard Güncellemesi**
```tsx
// apps/web-next/src/app/(dashboard)/page.tsx
'use client';
import { ServiceHealthGrid } from '@/components/dashboard/ServiceHealthGrid';
import { KeyMetricsGrid } from '@/components/dashboard/KeyMetricsGrid';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Özeti</h1>
        <p className="text-gray-600">Spark Trading Platform v1.9-p3</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Anahtar Metrikler</h2>
        <KeyMetricsGrid />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Servis Durumu</h2>
        <ServiceHealthGrid />
      </section>
    </div>
  );
}
```

#### Test
```powershell
# 1. API'leri test et
curl http://localhost:3003/api/services/health
curl http://localhost:3003/api/metrics/summary

# 2. Dashboard'u aç
http://localhost:3003/

# 3. Kontrol et:
# ✅ Metrikler görünüyor
# ✅ Servis durumları gösteriliyor
# ✅ 10 saniyede bir otomatik yenileniyor (SWR)
```

---

### ADIM 2: STRATEJİLERİM SAYFASI (Öncelik: YÜKSEK)
**Süre**: 2-3 saat  
**Hedef**: Stratejileri listele, çalıştır, durdur, sil

#### Dosyalar
```
apps/web-next/src/
├── app/(dashboard)/strategies/page.tsx    ← Yeni
├── components/strategies/
│   ├── StrategyList.tsx                  ← Yeni
│   ├── StrategyCard.tsx                  ← Yeni
│   └── StrategyActions.tsx               ← Yeni
└── app/api/strategies/
    ├── route.ts                          ← Yeni (GET, POST)
    └── [id]/route.ts                     ← Yeni (GET, DELETE)
```

#### API Endpoint'leri
```typescript
// 1. Strateji Listesi
GET /api/strategies
Response: [
  {
    id: "str_123",
    name: "MA Crossover",
    status: "idle",
    category: "manual",
    createdAt: "2025-10-09T10:00:00Z"
  },
  ...
]

// 2. Strateji Başlat
POST /api/exec/start
Body: { strategyId: "str_123" }
Response: { status: "started", runId: "run_456" }

// 3. Strateji Durdur
POST /api/exec/stop
Body: { strategyId: "str_123" }

// 4. Strateji Sil
DELETE /api/strategies/str_123
```

#### Bileşenler

**StrategyCard.tsx**
```tsx
'use client';
import { Card, Badge } from '@tremor/react';
import { Play, Square, Edit, Trash2 } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'stopped';
  category: string;
}

export function StrategyCard({ strategy, onAction }: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{strategy.name}</h3>
          <p className="text-sm text-gray-500">{strategy.category}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge color={strategy.status === 'running' ? 'green' : 'gray'}>
            {strategy.status === 'running' ? 'Çalışıyor' : 'Durduruldu'}
          </Badge>
          
          <div className="flex gap-1">
            {strategy.status === 'running' ? (
              <button
                onClick={() => onAction('stop', strategy.id)}
                className="p-2 hover:bg-red-100 rounded"
              >
                <Square className="h-4 w-4 text-red-600" />
              </button>
            ) : (
              <button
                onClick={() => onAction('start', strategy.id)}
                className="p-2 hover:bg-green-100 rounded"
              >
                <Play className="h-4 w-4 text-green-600" />
              </button>
            )}
            
            <button
              onClick={() => onAction('edit', strategy.id)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onAction('delete', strategy.id)}
              className="p-2 hover:bg-red-100 rounded"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

### ADIM 3: ÇALIŞAN STRATEJİLER (Öncelik: ORTA)
**Süre**: 3-4 saat  
**Hedef**: Real-time monitoring, WebSocket entegrasyonu

#### Özellikler
- WebSocket bağlantısı (canlı updates)
- Mini P/L grafiği (sparkline)
- İşlem sayısı, kazanç tracking
- Durdur/Duraklat kontrolleri

---

### ADIM 4: PORTFÖY SAYFASI (Öncelik: ORTA)
**Süre**: 3-4 saat  
**Hedef**: Borsa hesapları, varlıklar, toplam değer

#### Özellikler
- Borsa sekmeler (Binance, BTCTurk)
- Varlık tablosu (coin, miktar, değer, %)
- Toplam portföy değeri
- Yenile butonu

---

### ADIM 5: AYARLAR SAYFASI (Öncelik: DÜŞÜK)
**Süre**: 2-3 saat  
**Hedef**: API keys, tema, dil ayarları

#### Özellikler
- Binance API Key/Secret girişi
- BTCTurk API credentials
- OpenAI API key (Copilot için)
- Tema değiştirme (Light/Dark)
- Dil seçimi (TR/EN)

---

### ADIM 6: POLISH & TEST (Öncelik: YÜKSEK)
**Süre**: 2-3 saat  
**Hedef**: Bug fix, responsive, UX iyileştirmeleri

#### Kontrol Listesi
- [ ] Tüm sayfalar mobile responsive
- [ ] Loading states her yerde
- [ ] Error handling tam
- [ ] Toast notifications çalışıyor
- [ ] TypeScript hatasız
- [ ] E2E test senaryoları

---

## 📅 TAHMİNİ SÜRE

```
ADIM 1: Ana Dashboard          → 2-3 saat  ⭐ ÖNCELİK
ADIM 2: Stratejilerim          → 2-3 saat  ⭐ ÖNCELİK
ADIM 3: Çalışan Stratejiler    → 3-4 saat
ADIM 4: Portföy                → 3-4 saat
ADIM 5: Ayarlar                → 2-3 saat
ADIM 6: Polish & Test          → 2-3 saat

TOPLAM: 14-20 saat (~2-3 gün full-time)
```

---

## 🚀 HEMEN ŞİMDİ BAŞLANACAK

**İlk Görev**: Ana Dashboard oluştur

```powershell
# 1. Bileşenleri oluştur
# ServiceHealthGrid.tsx
# KeyMetricsGrid.tsx

# 2. API route'ları oluştur
# /api/services/health
# /api/metrics/summary

# 3. Dashboard sayfasını güncelle
# apps/web-next/src/app/(dashboard)/page.tsx

# 4. Test et
pnpm dev
# http://localhost:3003
```

---

## 📝 NOTLAR

### Mock Data Stratejisi
Backend yoksa API route'ları mock data dönecek:

```typescript
// /api/services/health/route.ts
export async function GET() {
  try {
    // Gerçek health check
    const res = await fetch('http://localhost:4001/health');
    return NextResponse.json(await res.json());
  } catch {
    // Mock fallback
    return NextResponse.json({
      executor: { ok: false, error: 'Not running' },
      ml: { ok: false, error: 'Not running' },
    });
  }
}
```

### Progresif Geliştirme
Her adım bağımsız test edilebilir. Bir önceki adım tamamlanmadan sonrakine geçilebilir (çoğu bağımsız).

---

**Hazırlayan**: cursor (Claude 3.5 Sonnet)  
**Tarih**: 9 Ekim 2025  
**Durum**: ✅ ROADMAP HAZIR - İmplementasyon Başlayabilir

**Sonraki Aksiyon**: ADIM 1 (Ana Dashboard) başlat

