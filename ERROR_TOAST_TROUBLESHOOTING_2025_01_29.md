# 🔍 Error Toast Troubleshooting Guide

**Tarih:** 2025-01-29
**Durum:** 🔍 **HATA ANALİZİ GEREKLİ**

---

## 🎯 TESPİT EDİLEN SORUN

**Görünen:** Sol altta "1 error" toast/banner
**Kaynak:** `ErrorSink` component (runtime error yakalama)
**Yer:** `apps/web-next/src/components/core/ErrorSink.tsx`

---

## 🔍 HATA YAKALAMA ADIMLARI

### 1. Hard Reload (Cache Bypass)
```
Ctrl+Shift+R (Chrome/Edge)
```
- Eğer toast kayboluyorsa: Eski error state'i persist kalmış (state cleanup gerekli)
- Eğer toast kalıyorsa: Aktif runtime hatası var

### 2. DevTools Console Aç
```
F12 → Console tab
```

**Aranacak:**
- En üstteki ilk kırmızı hata
- `[UI]` prefix'li console.error mesajları
- Unhandled promise rejection mesajları

**Kopyalanacak:**
- İlk 10 satır hata mesajı
- Stack trace (varsa)

### 3. Network Tab Kontrolü
```
F12 → Network tab → Status'a göre sırala
```

**Aranacak:**
- 404/500 status'lu istekler
- `(failed)` veya `net::ERR_CONNECTION_REFUSED` olan istekler
- Özellikle:
  - `ws://...` (WebSocket) istekleri
  - `/api/...` istekleri

**Kopyalanacak:**
- İlk failed request URL
- Status code
- Error message

---

## 📊 MEVCUT ERROR HANDLING

### ErrorSink Component

**Dosya:** `apps/web-next/src/components/core/ErrorSink.tsx`

**Yakaladığı Hatalar:**
- `window.error` events (runtime errors)
- `unhandledrejection` events (promise rejections)

**Davranış:**
- Dev mode'da: En fazla 3 error gösterir
- Prod mode'da: Bastırır (sessiz)

**Gösterim:**
```tsx
<div className="fixed left-4 bottom-4 z-[1000] rounded-xl bg-red-500/90 text-white px-3 py-2 shadow-lg">
  {errs.length} error{errs.length>1?"s":""} – detaylar console'da
</div>
```

### Error Budget Badge

**Dosya:** `apps/web-next/src/components/ops/ErrorBudgetBadge.tsx`

**Kaynak:** `/api/public/error-budget` endpoint
**Gösterim:** Üst şeritte "EB X.X%" badge

---

## 🔍 OLASI HATA KAYNAKLARI

### 1. WebSocket Bağlantı Hatası
**Belirtiler:**
- "Veri Akışı: Çalışmıyor" gösterimi
- Network'te `ws://127.0.0.1:4001/...` failed
- Console'da WebSocket connection error

**Kontrol:**
```bash
# Executor/Streams servisi çalışıyor mu?
curl http://127.0.0.1:4001/api/public/metrics
```

### 2. API Fetch Hatası
**Belirtiler:**
- Network'te `/api/...` istekleri 404/500
- Console'da fetch error

**Kontrol:**
```bash
# API endpoint'leri çalışıyor mu?
curl http://127.0.0.1:3003/api/public/metrics
curl http://127.0.0.1:3003/api/portfolio
```

### 3. Executor Bağlantı Hatası
**Belirtiler:**
- "Aracı: Çevrimdışı" gösterimi
- API proxy'lerde connection refused

**Kontrol:**
```bash
# Executor servisi çalışıyor mu?
curl http://127.0.0.1:4001/api/public/metrics
```

---

## ✅ HIZLI ÇÖZÜMLER

### Çözüm 1: Hard Reload
```
Ctrl+Shift+R
```
Eğer toast kaybolursa → State cleanup iyileştirmesi gerekli

### Çözüm 2: Console'dan Hata Mesajını Kopyala
1. F12 → Console
2. İlk kırmızı hatayı kopyala
3. Bu mesajı paylaş → Direkt patch hazırlanır

### Çözüm 3: Network'ten Failed Request'i Kopyala
1. F12 → Network → Status'a göre sırala
2. İlk failed request'i kopyala (URL + status)
3. Bu bilgiyi paylaş → Backend/API sorununu buluruz

---

## 🚀 KALICI ÇÖZÜM ÖNERİLERİ (P0 UX)

### 1. ErrorSink İyileştirmesi

**Sorun:** Error toast kapatılamıyor
**Çözüm:** Close button + auto-dismiss ekle

```tsx
<div className="fixed left-4 bottom-4 z-[1000] rounded-xl bg-red-500/90 text-white px-3 py-2 shadow-lg">
  <div className="flex items-center gap-2">
    <span>{errs.length} error{errs.length>1?"s":""}</span>
    <button onClick={() => setErrs([])}>×</button>
  </div>
</div>
```

### 2. Connection Error Handling

**Sorun:** WS/API hatası error yerine warning olmalı
**Çözüm:** Connection error'ları warning seviyesine çek

```tsx
// ErrorSink.tsx'te
const isConnectionError = msg.includes('Connection') || msg.includes('fetch');
const severity = isConnectionError ? 'warning' : 'error';
```

### 3. Duplicate Error Prevention

**Sorun:** Üst şeritteki "WS/Executor" göstergesi varken duplicate error spam
**Çözüm:** Connection error'ları ErrorSink'ten filtrele

```tsx
const push = (msg: string) => {
  // Connection error'ları filtrele (zaten status bar'da gösteriliyor)
  if (msg.includes('Connection') || msg.includes('fetch failed')) return;
  // ...
};
```

---

## 📝 SONRAKİ ADIMLAR

1. **Hata Yakalama:**
   - Console'dan ilk hata mesajını kopyala
   - Network'ten failed request'i kopyala

2. **Root Cause Analysis:**
   - Hata mesajına göre kaynak belirlenir
   - Backend/API sorunları için servis kontrolü

3. **Patch Uygulama:**
   - Error handling iyileştirmesi
   - UX improvement (warning vs error)

---

**Rapor Hazırlayan:** Auto (Claude 4.1 Opus)
**Son Güncelleme:** 2025-01-29

