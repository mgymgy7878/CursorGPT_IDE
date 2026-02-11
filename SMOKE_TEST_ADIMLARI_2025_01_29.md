# 🧪 SMOKE TEST ADIMLARI - Executor DB Layer

**Tarih:** 29 Ocak 2025
**Hedef:** Executor servisinin DB bağlantısı ile deterministik health endpoint'i

---

## ⚠️ ÖN KOŞUL

**Docker Desktop çalışıyor olmalı!**

Eğer Docker Desktop çalışmıyorsa:
1. Docker Desktop'ı başlatın
2. Sistem tray'de Docker ikonu yeşil olana kadar bekleyin
3. Bu adımları tekrar çalıştırın

---

## 0️⃣ PREFLIGHT ✅

```powershell
node -v    # v22.20.0 ✅
pnpm -v    # 10.18.3 ✅
docker -v  # Docker version 28.5.1 ✅

netstat -ano | findstr ":4001"  # Boş ✅
netstat -ano | findstr ":5432"  # Boş ✅
```

**Durum:** ✅ Tamamlandı

---

## 1️⃣ DEPENDENCIES

```powershell
pnpm install
```

**Çıktıyı buraya yapıştırın:**
```
[ÇIKTI BURAYA]
```

---

## 2️⃣ .env DOSYASI

Root dizinde `.env` dosyası oluşturun:

```env
DATABASE_URL="postgresql://spark_user:spark_secure_password_2024@localhost:5432/spark_trading?schema=public"
EXECUTOR_URL="http://127.0.0.1:4001"
PORT=4001
HOST="0.0.0.0"
```

**✅ Dosya oluşturuldu mu?** [ ] Evet

---

## 3️⃣ POSTGRESQL BAŞLATMA

```powershell
# PostgreSQL'i başlat
docker compose up -d postgres

# Durum kontrol
docker compose ps postgres

# Log kontrol (ilk 80 satır)
docker compose logs postgres --tail 80
```

### docker compose ps postgres çıktısı:
```
[ÇIKTI BURAYA]
```

### docker compose logs postgres --tail 80 çıktısı:
```
[ÇIKTI BURAYA]
```

**Beklenen:**
- Container `spark-postgres` **running**
- Healthcheck **passing**
- Log: "database system is ready to accept connections"

---

## 4️⃣ PRISMA MIGRATION

```powershell
# Prisma Client generate
pnpm exec prisma generate

# İlk migration
pnpm exec prisma migrate dev --name init

# Migration durumu
pnpm exec prisma migrate status
```

### pnpm exec prisma migrate status çıktısı:
```
[ÇIKTI BURAYA]
```

**Beklenen:**
- Prisma Client generated ✅
- Migration applied ✅
- Database tables created ✅

**Olası Sorun:**
Eğer migration hata verirse (schema bulunamadı vb.), önce:
```powershell
pnpm exec prisma migrate reset  # Dev'de data siler, temiz başlar
```

---

## 5️⃣ EXECUTOR BAŞLATMA

**Yeni bir terminal açın** ve şu komutu çalıştırın:

```powershell
pnpm --filter @spark/executor dev
```

### Executor Terminal Log (İlk 40 satır):
```
[ÇIKTI BURAYA]
```

### Port Kontrol (Başka terminal):
```powershell
netstat -ano | findstr ":4001"
```

**Beklenen:**
```
TCP    0.0.0.0:4001           0.0.0.0:0              LISTENING       12345
```

**Beklenen Log Mesajları:**
- `✅ Loaded .env from: ...`
- `✅ executor running on http://0.0.0.0:4001`

---

## 6️⃣ HEALTH ENDPOINT DOĞRULAMA

**PowerShell'de (Executor çalışırken):**

```powershell
curl.exe http://127.0.0.1:4001/health
curl.exe http://127.0.0.1:4001/healthz
```

### curl.exe http://127.0.0.1:4001/health çıktısı:
```json
[ÇIKTI BURAYA]
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
  "error": "...",
  "ts": 1735584000000
}
```

---

## 7️⃣ UI DOĞRULAMA

1. Web UI'yi açın: http://127.0.0.1:3003
2. Settings > Connection Health sekmesine gidin
3. Executor durumunu kontrol edin

**Executor Durumu:**
- [ ] **Healthy** (yeşil) - DB connected ✅
- [ ] **Degraded** (turuncu) - DB disconnected ama servis çalışıyor 🟡
- [ ] **Offline** (kırmızı) - Servis çalışmıyor ❌

---

## 📊 SONUÇ ÖZETİ

- [ ] Dependencies kuruldu
- [ ] .env dosyası oluşturuldu
- [ ] PostgreSQL başlatıldı ve healthy
- [ ] Prisma migration başarılı
- [ ] Executor servisi çalışıyor (port 4001)
- [ ] Health endpoint doğru response döndürüyor
- [ ] UI Connection Health Executor'u doğru gösteriyor

---

## 🔧 OLASI SORUNLAR VE ÇÖZÜMLER

### 1. DATABASE_URL uyuşmazlığı
**Sorun:** Docker compose'daki user/password/db ile .env'deki farklı
**Çözüm:** `.env` dosyasındaki `DATABASE_URL`'yi docker-compose.yml ile birebir eşleştirin:
- DB: `spark_trading`
- User: `spark_user`
- Password: `spark_secure_password_2024`
- Port: `5432`

### 2. Port 5432 çakışması
**Sorun:** Yerel PostgreSQL çalışıyor
**Çözüm:**
- Ya yerel PostgreSQL'i durdurun
- Ya da docker-compose.yml'de port mapping'i değiştirin (örn: `"5433:5432"`)

### 3. Prisma schema path sorunu
**Sorun:** `prisma migrate dev` schema bulamıyor
**Çözüm:** Komutları **root dizinden** çalıştırın (monorepo yapısı)

### 4. Executor .env yükleme sorunu
**Sorun:** Executor .env dosyasını bulamıyor
**Çözüm:** `.env` dosyasının root dizinde olduğundan emin olun

---

**Tüm çıktıları `SMOKE_TEST_KANIT_PAKETI_2025_01_29.md` dosyasına kopyalayın.**

