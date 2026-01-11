# 🧪 SMOKE TEST KANIT PAKETI

**Tarih:** 29 Ocak 2025
**Hedef:** Executor DB Layer + Health Endpoint Deterministik Test
**Durum:** 🔄 Devam Ediyor

---

## 0️⃣ PREFLIGHT KONTROL

### Versiyonlar
```powershell
node -v    # v22.20.0 ✅
pnpm -v    # 10.18.3 ✅
docker -v  # Docker version 28.5.1 ✅
```

### Port Durumu
```powershell
netstat -ano | findstr ":4001"  # Boş ✅
netstat -ano | findstr ":5432"  # Boş ✅
```

**Sonuç:** Tüm ön koşullar sağlandı, portlar kullanılabilir.

---

## 1️⃣ DEPENDENCIES

```powershell
pnpm install
```

**Durum:** 🔄 Kontrol ediliyor...

---

## 2️⃣ .env DOSYASI

**Konum:** Root dizini (`.env`)

**İçerik:**
```env
DATABASE_URL="postgresql://spark_user:spark_secure_password_2024@localhost:5432/spark_trading?schema=public"
EXECUTOR_URL="http://127.0.0.1:4001"
PORT=4001
HOST="0.0.0.0"
```

**Durum:** ⏳ Oluşturulacak...

---

## 3️⃣ POSTGRESQL BAŞLATMA

```powershell
docker compose up -d postgres
docker compose ps postgres
docker compose logs postgres --tail 80
```

**Durum:** ⏳ Bekleniyor...

**Beklenen:**
- Container `spark-postgres` running
- Healthcheck passing
- Log: "database system is ready to accept connections"

---

## 4️⃣ PRISMA MIGRATION

```powershell
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
pnpm exec prisma migrate status
```

**Durum:** ⏳ Bekleniyor...

**Beklenen:**
- Prisma Client generated
- Migration applied
- Database tables created

---

## 5️⃣ EXECUTOR BAŞLATMA

```powershell
pnpm --filter @spark/executor dev
```

**Terminal Log (İlk 40 satır):**
```
[WAITING FOR EXECUTION]
```

**Port Kontrol:**
```powershell
netstat -ano | findstr ":4001"
```

**Beklenen:**
- Port 4001 LISTENING
- Log: "✅ executor running on http://0.0.0.0:4001"
- .env loaded message

---

## 6️⃣ HEALTH ENDPOINT DOĞRULAMA

```powershell
curl.exe http://127.0.0.1:4001/health
curl.exe http://127.0.0.1:4001/healthz
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

**Durum:** ⏳ Bekleniyor...

---

## 7️⃣ UI DOĞRULAMA

**URL:** http://127.0.0.1:3003/settings → Connection Health

**Beklenen Executor Durumu:**
- ✅ **Healthy** (yeşil) - DB connected
- 🟡 **Degraded** (turuncu) - DB disconnected ama servis çalışıyor
- ❌ **Offline** (kırmızı) - Servis çalışmıyor

**Durum:** ⏳ Bekleniyor...

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

**Not:** Bu dosya smoke test sırasında doldurulacak kanıt paketi template'idir.

