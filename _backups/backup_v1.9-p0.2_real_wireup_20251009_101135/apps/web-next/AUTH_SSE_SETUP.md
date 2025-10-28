# 🔐 Auth + SSE Setup Guide

## ✅ Tamamlanan Özellikler

### 1. **Authentication Middleware** (`middleware.ts`)
- ✅ Basic Auth token kontrolü
- ✅ 3 yol: `Authorization` header, `x-admin-token` header, `admin-token` cookie
- ✅ Korumalı endpoint'ler:
  - `/api/optimizer/*` (pause, resume, cancel)
  - `/api/gates/promote-request`
  - `/admin/*`

### 2. **Server-Sent Events (SSE)** (`/api/optimizer/stream`)
- ✅ Real-time queue updates (2s interval)
- ✅ Auto-reconnect on error
- ✅ Fallback to polling (5s) if SSE fails
- ✅ Keep-alive ping (30s)

### 3. **Client Auth Library** (`lib/auth.ts`)
- ✅ Token storage (localStorage + cookie)
- ✅ `getAuthToken()`, `setAuthToken()`, `clearAuthToken()`
- ✅ `getAuthHeaders()` helper

### 4. **UI Updates**
- ✅ `/optimizer` - Auth-aware Pause/Resume/Cancel buttons
- ✅ `/gates` - Auth-aware Promote button
- ✅ SSE connection indicator (green pulse)
- ✅ Polling fallback indicator (amber text)

---

## 🚀 Kullanım

### **1. Dev Mode (No Auth)**
```bash
# .env.local oluşturma
# ADMIN_TOKEN yoksa → tüm işlemler serbest
cd apps/web-next
pnpm dev
```

**Sonuç:** Tüm butonlar aktif, SSE çalışır.

---

### **2. Production Mode (With Auth)**
```bash
# .env.local oluştur
echo "ADMIN_TOKEN=your-secret-token-here" > apps/web-next/.env.local

# Server'ı başlat
pnpm dev
```

**Test:**
```bash
# Browser console'da token ayarla
localStorage.setItem('admin-token', 'your-secret-token-here')

# Sayfayı yenile → butonlar aktif
```

**Ya da:**
```typescript
// UI'da login butonu ekle
import { setAuthToken } from '@/lib/auth';

function handleLogin() {
  const token = prompt('Admin Token:');
  if (token) {
    setAuthToken(token);
    window.location.reload();
  }
}
```

---

### **3. API İstekleri (cURL)**
```bash
# Pause optimizer (with auth)
curl -X POST http://localhost:3003/api/optimizer/pause \
  -H "Content-Type: application/json" \
  -H "x-admin-token: your-secret-token-here" \
  -d '{"pause": true}'

# Promote request (with auth)
curl -X POST http://localhost:3003/api/gates/promote-request \
  -H "x-admin-token: your-secret-token-here"

# SSE stream (listen for updates)
curl -N http://localhost:3003/api/optimizer/stream
```

---

## 📊 SSE vs Polling Karşılaştırması

| Özellik | SSE | Polling (Fallback) |
|---------|-----|-------------------|
| **Latency** | ~2s (server push) | ~5s (client pull) |
| **Overhead** | Düşük (tek bağlantı) | Yüksek (her istekte HTTP) |
| **Battery** | Verimli | Daha fazla tüketim |
| **Indicator** | 🟢 "SSE Live" (pulse) | 🟡 "Polling (5s)" |
| **Auto-reconnect** | ✅ | N/A |

---

## 🔧 Sorun Giderme

### **SSE bağlanamıyor**
```bash
# Browser console'da hata kontrolü
# Beklenen: "SSE parse error" veya network hatası

# Çözüm 1: Polling'e manuel geçiş
# UI'da "Polling (5s)" görünüyorsa → zaten fallback'te

# Çözüm 2: Server restart
pnpm dev
```

### **Auth başarısız (401)**
```bash
# 1. Token doğru mu?
localStorage.getItem('admin-token')
# → "your-secret-token-here"

# 2. .env.local dosyası var mı?
cat apps/web-next/.env.local
# → ADMIN_TOKEN=your-secret-token-here

# 3. Server restart ettiniz mi?
pnpm dev
```

### **Butonlar pasif**
```typescript
// Browser console'da kontrol
import { isAuthenticated } from '@/lib/auth';
console.log(isAuthenticated()); // → true olmalı

// Yoksa token ayarla
localStorage.setItem('admin-token', 'your-token');
location.reload();
```

---

## 🎯 Sonraki Adımlar

### **Önerilen İyileştirmeler:**
1. 📋 **Login UI** - Modal + form (`/login` sayfası)
2. 🔑 **JWT Support** - Token expiration + refresh
3. 🔐 **Role-based Access** - admin, operator, viewer
4. 📡 **SSE for Export** - `/api/export/stream`
5. 🌐 **WebSocket Alternative** - Bi-directional comm

### **Quick Wins:**
- 🎨 Token girişi için üst navbar'a buton ekle
- 📊 `/dashboard` sayfasına "Auth Status" kartı
- 🔔 Token expire warning (JWT ile)

---

## ✅ DoD (Definition of Done)

- [x] Middleware auth kontrolü (401 unauthorized)
- [x] SSE endpoint (/api/optimizer/stream)
- [x] Client-side EventSource integration
- [x] Fallback to polling on SSE error
- [x] Auth-aware UI buttons (disabled when no token)
- [x] 401 error handling (alert with message)
- [x] Connection indicator (SSE Live / Polling)
- [x] Auto-reconnect (5s delay)
- [x] Keep-alive ping (30s)

**Status:** ✅ **COMPLETE** → Ready for `/backtest` next!

