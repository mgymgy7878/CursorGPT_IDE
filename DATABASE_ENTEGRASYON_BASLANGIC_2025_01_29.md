# 🗄️ DATABASE ENTEGRASYONU - BAŞLANGIÇ RAPORU

**Tarih:** 29 Ocak 2025
**Durum:** ✅ Hazırlık Tamamlandı - Kurulum Bekleniyor
**Versiyon:** v1.3.2-SNAPSHOT → v1.4.0 (Database Layer)

---

## ✅ TAMAMLANAN ADIMLAR

### 1. PostgreSQL Docker Servisi
✅ `docker-compose.yml` dosyasına PostgreSQL servisi eklendi:
- **Image:** `postgres:16-alpine`
- **Port:** `5432`
- **Database:** `spark_trading`
- **User:** `spark_user`
- **Health Check:** Aktif (pg_isready)

### 2. Prisma Schema
✅ Aktif `prisma/schema.prisma` dosyası oluşturuldu:

**Models:**
- `User` - Kullanıcı hesapları
- `Strategy` - Strateji tanımları
- `Backtest` - Backtest sonuçları
- `Trade` - İşlem geçmişi (Decimal precision)
- `Position` - Açık pozisyonlar
- `AuditLog` - Audit kayıtları
- `IdempotencyKey` - Idempotency kontrolü

**Özellikler:**
- ✅ Decimal(38,18) precision (finansal hesaplamalar için)
- ✅ Enum types (type safety)
- ✅ Proper indexes (performans)
- ✅ Cascade deletes (data integrity)
- ✅ Unique constraints (duplicate prevention)

---

## 📋 SONRAKİ ADIMLAR (Manuel)

### Adım 1: Prisma Dependencies Kurulumu

```powershell
# Root dizinde
pnpm add -w prisma @prisma/client
pnpm add -D -w prisma
```

### Adım 2: Environment Variable Ekleme

`.env` dosyası oluşturun (veya mevcut `.env` dosyasına ekleyin):

```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://spark_user:spark_secure_password_2024@localhost:5432/spark_trading?schema=public"
```

**Not:** `.env` dosyasını `.gitignore`'a ekleyin (güvenlik).

### Adım 3: PostgreSQL Servisini Başlatma

```powershell
# Docker Compose ile PostgreSQL'i başlat
docker-compose up -d postgres

# Servis durumunu kontrol et
docker-compose ps postgres

# Logları kontrol et
docker-compose logs postgres
```

### Adım 4: Prisma Migration

```powershell
# Prisma Client'ı generate et
pnpm exec prisma generate

# İlk migration'ı oluştur
pnpm exec prisma migrate dev --name init

# Migration durumunu kontrol et
pnpm exec prisma migrate status
```

### Adım 5: PrismaClient Singleton Oluşturma

**Dosya:** `services/executor/src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
```

### Adım 6: Executor Service'e Entegrasyon

**Dosya:** `services/executor/src/server.ts`

```typescript
import { prisma } from './lib/db';

// Health check endpoint'e DB kontrolü ekle
fastify.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', db: 'connected' };
  } catch (error) {
    return { status: 'unhealthy', db: 'disconnected' };
  }
});
```

### Adım 7: Seed Data Scripti (Opsiyonel)

**Dosya:** `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Dev user oluştur
  const user = await prisma.user.upsert({
    where: { email: 'dev@spark.local' },
    update: {},
    create: {
      email: 'dev@spark.local',
      name: 'Dev User',
    },
  });

  console.log('Seed data created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**package.json'a ekle:**
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Çalıştır:**
```powershell
pnpm exec prisma db seed
```

---

## 🔍 DOĞRULAMA ADIMLARI

### 1. Database Bağlantısı Test
```powershell
# PostgreSQL'e bağlan
docker exec -it spark-postgres psql -U spark_user -d spark_trading

# Tabloları kontrol et
\dt

# User tablosunu kontrol et
SELECT * FROM "User";
```

### 2. Prisma Studio (Visual DB Browser)
```powershell
pnpm exec prisma studio
```
Tarayıcıda açılacak: `http://localhost:5555`

### 3. Executor Health Check
```powershell
# Executor servisini başlat
pnpm --filter @spark/executor dev

# Health endpoint'i test et
curl http://localhost:4001/health
```

---

## 📊 SCHEMA YAPISI ÖZET

### İlişkiler (Relations)
```
User (1) ──< (N) Strategy
Strategy (1) ──< (N) Backtest
Strategy (1) ──< (N) Trade
Strategy (1) ──< (N) Position
```

### Indexes
- **User:** `email` (unique)
- **Strategy:** `[userId, status]`, `[status, updatedAt]`, `[userId, createdAt]`
- **Backtest:** `[strategyId, status]`, `[userId, createdAt]`, `[status, createdAt]`
- **Trade:** `[strategyId, createdAt]`, `[symbol, exchange]`, `[status, createdAt]`
- **Position:** `[exchange, symbol]`, `[strategyId, updatedAt]`

### Decimal Precision
Tüm finansal alanlar `Decimal(38, 18)` kullanıyor:
- `Trade.price`
- `Trade.quantity`
- `Trade.commission`
- `Trade.pnl`
- `Position.quantity`
- `Position.avgPrice`

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Güvenlik:** `.env` dosyasını `.gitignore`'a ekleyin
2. **Backup:** Production'da otomatik backup stratejisi kurun
3. **Connection Pooling:** Prisma varsayılan olarak connection pooling kullanıyor
4. **Migration:** Production'da `prisma migrate deploy` kullanın
5. **Decimal:** JavaScript'te Decimal değerleri `toString()` ile kullanın

---

## 🔗 İLGİLİ DOSYALAR

- `docker-compose.yml` - PostgreSQL servisi
- `prisma/schema.prisma` - Database schema
- `prisma/schema-v1.4-enhanced.prisma` - Kaynak schema (backup)
- `.github/ISSUE_TEMPLATE/p0-database-layer.md` - Issue template

---

## 📚 KAYNAKLAR

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don't_Do_This)
- [Prisma Decimal Handling](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#native-types)

---

**Sonraki Adım:** Manuel kurulum adımlarını takip edin veya otomatik kurulum scripti çalıştırın.

