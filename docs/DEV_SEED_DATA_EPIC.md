# Dev-Only Fake Data Epic

**Versiyon:** v1.3 (Planlanan)
**Amaç:** Scroll davranışını gerçekten test etmek için uzun içerik simülasyonu

---

## 1. Genel Bakış

**Problem:** Çoğu sayfa şu an boş/az içerikli; scroll görünmemesi normaldir. Ancak scroll davranışını gerçekten test etmek için uzun içerik gerekiyor.

**Çözüm:** Development ortamında fake seed data sistemi.

**Faydalar:**
- Scroll davranışını gerçekten görebiliriz
- "Empty state, scroll yok" ile "uzun liste, iç scroll" farkı net olacak
- UI testleri daha gerçekçi olacak

---

## 2. Yapı

### 2.1 Klasör Yapısı

```
apps/web-next/src/dev-seed/
├── index.ts              # Ana export'lar
├── strategies.ts         # Fake strateji generator
├── positions.ts          # Fake pozisyon generator
├── alerts.ts            # Fake alert generator
└── audit.ts             # Fake audit log generator
```

### 2.2 Environment Flag

**Flag:** `NEXT_PUBLIC_DEV_SEED=1`

**Kullanım:**
```bash
# .env.local
NEXT_PUBLIC_DEV_SEED=1
```

**Kontrol:**
```typescript
const seedEnabled = process.env.NEXT_PUBLIC_DEV_SEED === '1';
```

---

## 3. Sayfa Bazlı Seed Data

### 3.1 `/strategies` - 30–40 Fake Strateji

**Pattern:**
```typescript
// apps/web-next/src/dev-seed/strategies.ts
export function fakeStrategies(count: number): Strategy[] {
  // ... fake data generation
}

// apps/web-next/src/app/strategies/page.tsx
import { fakeStrategies } from '@/dev-seed/strategies';

const seedEnabled = process.env.NEXT_PUBLIC_DEV_SEED === '1';
const allStrategies = seedEnabled
  ? [...strategies, ...fakeStrategies(30)]
  : strategies;
```

**Fake Strateji Özellikleri:**
- Farklı isimler (BTCUSDT EMA Crossover, ETHUSDT RSI, vb.)
- Farklı durumlar (active, paused, stopped)
- Farklı PnL değerleri (pozitif/negatif)
- Farklı oluşturulma tarihleri

### 3.2 `/portfolio` - 30–40 Pozisyon

**Pattern:**
```typescript
// apps/web-next/src/dev-seed/positions.ts
export function fakePositions(count: number): Position[] {
  // ... fake data generation
}

// apps/web-next/src/app/portfolio/page.tsx
import { fakePositions } from '@/dev-seed/positions';

const seedEnabled = process.env.NEXT_PUBLIC_DEV_SEED === '1';
const allPositions = seedEnabled
  ? [...positions, ...fakePositions(30)]
  : positions;
```

**Fake Pozisyon Özellikleri:**
- Farklı semboller (BTCUSDT, ETHUSDT, ADAUSDT, vb.)
- Farklı miktarlar
- Farklı entry fiyatları
- Farklı PnL değerleri (pozitif/negatif)
- Farklı açılma tarihleri

### 3.3 `/alerts` - 50+ Alert

**Pattern:**
```typescript
// apps/web-next/src/dev-seed/alerts.ts
export function fakeAlerts(count: number): Alert[] {
  // ... fake data generation
}

// apps/web-next/src/app/alerts/page.tsx
import { fakeAlerts } from '@/dev-seed/alerts';

const seedEnabled = process.env.NEXT_PUBLIC_DEV_SEED === '1';
const allAlerts = seedEnabled
  ? [...alerts, ...fakeAlerts(50)]
  : alerts;
```

**Fake Alert Özellikleri:**
- Farklı semboller
- Farklı timeframe'ler (1h, 4h, 1d, vb.)
- Farklı alert tipleri (price, volume, indicator, vb.)
- Farklı durumlar (active, paused)
- Farklı trigger tarihleri

### 3.4 `/audit` - 50+ Audit Kaydı

**Pattern:**
```typescript
// apps/web-next/src/dev-seed/audit.ts
export function fakeAuditLogs(count: number): AuditLog[] {
  // ... fake data generation
}

// apps/web-next/src/app/audit/page.tsx
import { fakeAuditLogs } from '@/dev-seed/audit';

const seedEnabled = process.env.NEXT_PUBLIC_DEV_SEED === '1';
const allLogs = seedEnabled
  ? [...logs, ...fakeAuditLogs(50)]
  : logs;
```

**Fake Audit Log Özellikleri:**
- Farklı actor'lar (user, system, api, vb.)
- Farklı action'lar (create, update, delete, start, stop, vb.)
- Farklı resource'lar (strategy, position, alert, vb.)
- Farklı status'lar (success, error, warning)
- Farklı timestamp'ler (son 7 gün içinde)

---

## 4. Ortak Pattern

### 4.1 Helper Function

```typescript
// apps/web-next/src/dev-seed/index.ts
export function getDevData<T>(
  seedEnabled: boolean,
  real: T[],
  fakeGenerator: (count: number) => T[],
  count: number
): T[] {
  if (!seedEnabled) return real;
  return [...real, ...fakeGenerator(count)];
}
```

### 4.2 Kullanım Örneği

```typescript
// apps/web-next/src/app/strategies/page.tsx
import { getDevData } from '@/dev-seed';
import { fakeStrategies } from '@/dev-seed/strategies';

const seedEnabled = process.env.NEXT_PUBLIC_DEV_SEED === '1';
const allStrategies = getDevData(
  seedEnabled,
  strategies,
  fakeStrategies,
  30
);
```

---

## 5. Test Senaryoları

### 5.1 Scroll Testi

**Empty State:**
- `NEXT_PUBLIC_DEV_SEED=0` → Sayfa boş, scroll görünmez (normal)

**Uzun Liste:**
- `NEXT_PUBLIC_DEV_SEED=1` → 30+ item, scroll container içinde scroll görünür

### 5.2 Layout Testi

**Kontrol Edilecekler:**
- [ ] Sidebar genişliği: 260-280px
- [ ] Üst sabit blok: Header/filters/tabs sabit
- [ ] data-scroll-container: İçerik scroll ediyor, sayfa scroll yok
- [ ] Copilot dock: Sağda sabit yükseklikte

---

## 6. Güvenlik

**Önemli:** Seed data sadece development ortamında aktif olmalı.

**Kontrol:**
```typescript
const seedEnabled =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_DEV_SEED === '1';
```

**Production'da:**
- `NEXT_PUBLIC_DEV_SEED` flag'i yoksa veya `0` ise seed data kullanılmaz
- Production build'de seed data kodları tree-shaking ile kaldırılabilir

---

## 7. Sonraki Adımlar

1. [ ] `apps/web-next/src/dev-seed/` klasörü oluştur
2. [ ] Her sayfa için fake data generator yaz
3. [ ] Sayfalarda seed data entegrasyonu yap
4. [ ] `.env.local` dosyasına `NEXT_PUBLIC_DEV_SEED=1` ekle
5. [ ] Scroll testi yap (empty state vs uzun liste)
6. [ ] Dokümantasyonu güncelle

---

**Not:** Bu epic v1.3 sprint'inde tamamlanacak.

