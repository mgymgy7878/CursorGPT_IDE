# UI-P0-001: Dev Server Troubleshooting

**Hata:** `ERR_CONNECTION_REFUSED` - `127.0.0.1:3003/dashboard`

---

## 🔧 Çözüm

### 1. Dev Server'ı Başlat

**Terminal'de:**
```bash
cd apps/web-next
pnpm dev
```

**Veya repo kökünden:**
```bash
pnpm --filter web-next dev
```

### 2. Server Başladı mı Kontrol Et

**Beklenen Çıktı:**
```
▲ Next.js 14.2.13
- Local:        http://localhost:3003
- ready started server on 0.0.0.0:3003
```

### 3. Tarayıcıda Aç

- URL: `http://127.0.0.1:3003/dashboard`
- Veya: `http://localhost:3003/dashboard`

---

## 🐛 Olası Sorunlar

### Port 3003 Kullanımda

**Kontrol:**
```bash
# Windows PowerShell
netstat -ano | findstr :3003
```

**Çözüm:**
- Port'u kullanan process'i kapat
- Veya `next.config.mjs`'de port'u değiştir

### Build Gerekli

**Eğer ilk kez çalıştırıyorsan:**
```bash
cd apps/web-next
pnpm build
pnpm dev
```

### Node Modules Eksik

**Çözüm:**
```bash
# Repo kökünden
pnpm install
```

---

## ✅ Dev Server Başladıktan Sonra

1. Tarayıcıda `http://127.0.0.1:3003/dashboard` aç
2. `UI_P0_001_MANUAL_TEST_CHECKLIST.md` dosyasındaki senaryoları takip et
3. Manuel testleri yap

---

**Not:** Dev server arka planda çalışıyor olmalı. Terminal'de "ready" mesajını görüyorsan, tarayıcıda sayfayı yenile.

