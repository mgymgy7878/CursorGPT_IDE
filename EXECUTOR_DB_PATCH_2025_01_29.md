# 🔧 PATCH: Executor DB Layer + Health Endpoint Güncellemesi

**Tarih:** 29 Ocak 2025
**Hedef:** Executor servisinin DB bağlantısı ile deterministik health endpoint'i
**Durum:** ✅ Kod Tamamlandı - Kurulum Bekleniyor

---

## 📋 PATCH ÖZETİ

### 1. Executor Offline Root Cause
**Durum:** ✅ Tespit edildi
- Port 4001'de servis çalışmıyor (netstat ile doğrulandı)
- Health endpoint mevcut (`/healthz`) ama `/health` eksik
- DB check yok

### 2. DB Layer Wiring (Prisma)
**Durum:** ✅ Tamamlandı
- `services/executor/src/lib/db.ts` - PrismaClient singleton oluşturuldu
- `services/executor/src/lib/env.ts` - Monorepo-safe env loader eklendi
- `services/executor/src/server.ts` - Health endpoint DB check ile güncellendi

### 3. Health Endpoint Deterministik Response
**Durum:** ✅ Tamamlandı

**Response Contract:**
```typescript
// DB connected
{
  status: "healthy",
  service: "executor",
  db: "connected",
  ts: 1234567890
}

// DB disconnected (degraded)
{
  status: "degraded",
  service: "executor",
  db: "disconnected",
  error: "Connection error message",
  ts: 1234567890
}
```

**Endpoints:**
- `GET /healthz` - Basit health check (eski, uyumluluk için)
- `GET /health` - DB check ile deterministik health (yeni)

---

## 🔧 YAPILAN DEĞİŞİKLİKLER

### 1. PrismaClient Singleton
**Dosya:** `services/executor/src/lib/db.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

// Graceful shutdown handlers
process.on("beforeExit", async () => await prisma.$disconnect());
```

**Özellikler:**
- ✅ Dev'de global cache (HMR uyumlu)
- ✅ Production'da her instance ayrı
- ✅ Graceful shutdown (SIGINT/SIGTERM/beforeExit)

### 2. Monorepo-Safe Env Loader
**Dosya:** `services/executor/src/lib/env.ts`

**Arama Sırası:**
1. `../../../../.env` (Root)
2. `../../.env` (Parent)
3. `../.env` (Executor dir)
4. `process.cwd()/.env` (Current working dir)

**Özellikler:**
- ✅ İlk bulunan .env dosyasını yükler
- ✅ dotenv yoksa process.env kullanır (graceful degradation)
- ✅ Auto-load (dev mode)

### 3. Health Endpoint Güncellemesi
**Dosya:** `services/executor/src/server.ts`

```typescript
app.get("/health", async () => {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  const status = dbStatus === "connected" ? "healthy" : "degraded";

  return {
    status,
    service: "executor",
    db: dbStatus,
    ...(dbError && { error: dbError }),
    ts: Date.now(),
  };
});
```

**Özellikler:**
- ✅ DB bağlantısını test eder
- ✅ Her zaman HTTP 200 döner (UI offline ayrımı için)
- ✅ Status: `healthy` (DB OK) veya `degraded` (DB NOK)
- ✅ Error message detayları (debug için)

### 4. Dependencies Güncellemesi
**Dosya:** `services/executor/package.json`

```json
{
  "dependencies": {
    "@prisma/client": "workspace:*",
    "dotenv": "^16.4.5"
  }
}
```

**Root:** `package.json`
```json
{
  "devDependencies": {
    "prisma": "^5.19.1"
  },
  "dependencies": {
    "@prisma/client": "^5.19.1"
  }
}
```

---

## 📝 NOTES

### .env Dosyası
- `.env` commit edilmeyecek (`.gitignore`'da olmalı)
- `.env.example` oluşturulmalı (template):
  ```env
  DATABASE_URL="postgresql://spark_user:spark_secure_password_2024@localhost:5432/spark_trading?schema=public"
  EXECUTOR_URL="http://127.0.0.1:4001"
  PORT=4001
  HOST="0.0.0.0"
  ```

### Docker Compose PostgreSQL
- ✅ Image: `postgres:16-alpine`
- ✅ Port: `5432`
- ✅ Database: `spark_trading`
- ✅ User: `spark_user`
- ✅ Password: `spark_secure_password_2024` (dev only)
- ✅ Healthcheck: `pg_isready` (10s interval)

### UI Değişiklikleri
- ❌ UI tarafı değişmeyecek (sadece executor health verisi düzelecek)
- UI Settings > Connection Health:
  - `status: "healthy"` → **Healthy** (yeşil)
  - `status: "degraded"` → **Degraded** (turuncu)
  - Endpoint fail → **Offline** (kırmızı)

---

## 🧪 SMOKE TEST

### 1. PostgreSQL Başlatma
```powershell
# Docker Compose ile PostgreSQL başlat
docker compose up -d postgres

# Durum kontrol
docker compose ps postgres

# Log kontrol (ilk 80 satır)
docker compose logs postgres --tail 80
```

**Beklenen:**
- Container `spark-postgres` running
- Port 5432 listening
- Healthcheck passing

### 2. Prisma Setup
```powershell
# Root dizinde
pnpm install  # Prisma dependencies kurulumu

# Prisma Client generate
pnpm exec prisma generate

# İlk migration
pnpm exec prisma migrate dev --name init
```

**Beklenen:**
- `node_modules/.prisma/client` oluştu
- Migration başarılı
- Database'de tablolar oluştu

### 3. Executor Başlatma
```powershell
# Executor servisini başlat (ayrı terminal)
pnpm --filter @spark/executor dev
```

**Beklenen:**
- `✅ executor running on http://0.0.0.0:4001`
- `.env` yüklendi (log'da görülür)
- PrismaClient bağlantı kurdu

### 4. Health Endpoint Test
```powershell
# Health endpoint test
curl http://127.0.0.1:4001/health
```

**Beklenen (DB Connected):**
```json
{
  "status": "healthy",
  "service": "executor",
  "db": "connected",
  "ts": 1735584000000
}
```

**Beklenen (DB Disconnected):**
```json
{
  "status": "degraded",
  "service": "executor",
  "db": "disconnected",
  "error": "P1001: Can't reach database server",
  "ts": 1735584000000
}
```

### 5. UI Connection Health Check
1. Web UI'yi aç: `http://127.0.0.1:3003`
2. Settings > Connection Health sekmesine git
3. Executor durumunu kontrol et

**Beklenen:**
- ✅ **Healthy** (yeşil) - DB connected
- 🟡 **Degraded** (turuncu) - DB disconnected ama servis çalışıyor
- ❌ **Offline** (kırmızı) - Servis çalışmıyor

---

## 🔄 REGRESSION MATRIX

### Type Check
```powershell
pnpm --filter web-next typecheck
pnpm --filter @spark/executor typecheck
```

### Lint
```powershell
pnpm --filter web-next lint
```

### Health Endpoint Contract
- ✅ JSON response stable (status, service, db, ts always present)
- ✅ HTTP 200 always (servis çalışıyorsa)
- ✅ Error message optional (sadece degraded durumda)

### DB Down Senaryosu
```powershell
# PostgreSQL'i durdur
docker compose stop postgres

# Health endpoint'i test et
curl http://127.0.0.1:4001/health

# Beklenen: 200 + status: "degraded" + db: "disconnected"
```

---

## 🎯 KURULUM ADIMLARI (Özet)

### Adım 1: Dependencies Kurulumu
```powershell
# Root dizinde
pnpm install
```

### Adım 2: .env Dosyası Oluştur
Root dizinde `.env` dosyası oluştur:
```env
DATABASE_URL="postgresql://spark_user:spark_secure_password_2024@localhost:5432/spark_trading?schema=public"
EXECUTOR_URL="http://127.0.0.1:4001"
PORT=4001
HOST="0.0.0.0"
```

### Adım 3: PostgreSQL Başlat
```powershell
docker compose up -d postgres
```

### Adım 4: Prisma Migration
```powershell
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
```

### Adım 5: Executor Başlat
```powershell
pnpm --filter @spark/executor dev
```

### Adım 6: Test
```powershell
curl http://127.0.0.1:4001/health
```

---

## 📊 BAŞARI KRİTERLERİ

- ✅ Executor `/health` endpoint HTTP 200 döner
- ✅ DB connected → `status: "healthy"`
- ✅ DB disconnected → `status: "degraded"` (ama HTTP 200)
- ✅ UI Settings > Connection Health Executor'u "Healthy" gösterir
- ✅ Type check ve lint geçer
- ✅ Graceful shutdown çalışır

---

**Sonraki Adım:** Kurulum adımlarını takip edip smoke test'i çalıştırın.

