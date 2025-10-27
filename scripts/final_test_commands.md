# 🚀 Spark Trading Platform - Final Test Komutları

## 📋 **TEST SENARYOLARI**

### **1. Backend Health Test**
```bash
# Windows
curl http://localhost:4001/public/health

# Unix
curl http://localhost:4001/public/health
```

**Beklenen Sonuç**: `{"ok":true,"service":"executor","ts":1755504517691,"info":{"port":4001,"mode":"dev"}}`

### **2. UI Local Health Test**
```bash
# Windows
curl http://localhost:3003/api/local/health

# Unix
curl http://localhost:3003/api/local/health
```

**Beklenen Sonuç**: `{"ok":true,"service":"web-next","ts":1755504517691}`

### **3. Proxy Rewrite Test**
```bash
# Windows
curl http://localhost:3003/api/public/health

# Unix
curl http://localhost:3003/api/public/health
```

**Beklenen Sonuç**: `{"ok":true,"service":"executor","ts":1755504517691,"info":{"port":4001,"mode":"dev"}}`

### **4. POST Body Test (Gövde Kaybı Kontrolü)**
```bash
# Windows
curl -X POST -H "Content-Type: application/json" -d "{\"msg\":\"test\"}" http://localhost:3003/api/public/test

# Unix
curl -X POST -H "Content-Type: application/json" -d '{"msg":"test"}' http://localhost:3003/api/public/test
```

**Beklenen Sonuç**: POST body'nin kaybolmadığını doğrula

### **5. Parity Page Test**
```bash
# Windows
curl http://localhost:3003/parity

# Unix
curl http://localhost:3003/parity
```

**Beklenen Sonuç**: HTML sayfası, "UI canlı. Proxy middleware rewrite ile aktif." metni

---

## 🔧 **BAŞLATMA KOMUTLARI**

### **Backend Başlatma**
```bash
# Windows
scripts\day70_backend_up.cmd

# Unix
bash scripts/day70_backend_up.sh
```

### **UI Başlatma**
```bash
# Windows
scripts\day70_proxy_fix.cmd

# Unix
bash scripts/day70_proxy_fix.sh
```

### **Manuel Başlatma**
```bash
# Backend (Terminal 1)
cd packages/executor
node dist/index.js

# UI (Terminal 2)
cd apps/web-next
pnpm dev
```

---

## 🧪 **E2E TESTLER**

### **Playwright Testleri**
```bash
# Tüm E2E testler
pnpm test:e2e

# Sadece UI smoke
pnpm exec playwright test tests/e2e/ui-smoke.spec.ts

# Sadece proxy health
pnpm exec playwright test tests/e2e/backend-proxy-health.spec.ts
```

### **Test Sonuçları**
- ✅ UI smoke: parity page renders and local health ok
- ✅ Proxy: /api/public/health → executor

---

## 🐳 **DOCKER COMPOSE TEST**

### **Lokal Production Provası**
```bash
# Build ve başlat
docker-compose up --build

# Test endpoint'leri
curl http://localhost:3003/api/local/health
curl http://localhost:3003/api/public/health
curl http://localhost:3003/parity

# Container içinden test
docker exec spark-trading-web-1 curl http://localhost:3003/api/local/health
docker exec spark-trading-web-1 curl http://localhost:3003/api/public/health
```

### **Docker Health Check**
```bash
# Container durumları
docker-compose ps

# Log'ları izle
docker-compose logs -f
```

---

## 🔄 **CI/CD PIPELINE TEST**

### **GitHub Actions**
```bash
# Manuel tetikleme (GitHub UI'dan)
# 1. Actions tab'ına git
# 2. "ci" workflow'unu seç
# 3. "Run workflow" butonuna tıkla
# 4. Branch seç (main)
# 5. "Run workflow" butonuna tıkla
```

### **Pipeline Adımları**
1. **build-test**: pnpm install → typecheck → test → build
2. **docker**: Docker image build → push to registry
3. **deploy**: Production deployment (main branch'te)

---

## ✅ **BAŞARI KRİTERLERİ**

### **Backend Testleri**
- [ ] `GET http://localhost:4001/public/health` → 200 OK
- [ ] Response: `{"ok":true,"service":"executor"}`

### **UI Testleri**
- [ ] `GET http://localhost:3003/api/local/health` → 200 OK
- [ ] Response: `{"ok":true,"service":"web-next"}`
- [ ] `GET http://localhost:3003/parity` → HTML sayfası

### **Proxy Testleri**
- [ ] `GET http://localhost:3003/api/public/health` → 200 OK
- [ ] Response: `{"ok":true,"service":"executor"}` (rewrite)
- [ ] POST body kaybolmuyor

### **E2E Testleri**
- [ ] Playwright smoke testleri geçiyor
- [ ] Proxy health testleri geçiyor

### **Docker Testleri**
- [ ] docker-compose up --build başarılı
- [ ] Container'lar sağlıklı
- [ ] Endpoint'ler çalışıyor

### **CI/CD Testleri**
- [ ] GitHub Actions pipeline geçiyor
- [ ] Build → Test → Docker → Deploy zinciri

---

## 🎯 **PRODUCTION READY CHECKLIST**

### **✅ Tamamlananlar**
- [x] Monorepo yapısı
- [x] Proxy middleware (rewrite)
- [x] Health endpoint'leri
- [x] TypeScript konfigürasyonu
- [x] Paket yapılandırması
- [x] Test altyapısı
- [x] Docker containerization
- [x] CI/CD pipeline
- [x] Backend stabil

### **⏳ Bekleyenler**
- [ ] UI başlatma doğrulama
- [ ] Proxy rewrite testi
- [ ] POST body testi
- [ ] E2E smoke testleri
- [ ] Docker compose provası
- [ ] CI/CD pipeline doğrulama

### **🎯 Hedef**
- [ ] Tüm testler geçiyor
- [ ] PRODUCTION_READY=TRUE
- [ ] Sistem production'a hazır

---

## 🚨 **SORUN GİDERME**

### **Port Çakışması**
```bash
# Windows
netstat -ano | findstr :3003
taskkill /f /pid <PID>

# Unix
lsof -i :3003
kill -9 <PID>
```

### **UI Başlatma Sorunu**
```bash
# Filter sorunu
pnpm --filter "web-next" dev

# Manuel başlatma
cd apps/web-next && pnpm dev
```

### **Proxy Sorunu**
```bash
# Middleware log'ları
# Next.js console'da middleware log'larını kontrol et

# Environment kontrolü
echo $NEXT_PUBLIC_EXECUTOR_ORIGIN
echo $EXECUTOR_ORIGIN
```

---

*Bu komutlar Spark Trading Platform'un final test sürecini kapsar. Tüm testler geçtiğinde sistem production'a hazır demektir.* 