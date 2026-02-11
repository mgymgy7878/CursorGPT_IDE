# TopStatusBar - Canlı Health Göstergeleri

## ✅ Eklenen Özellikler

TopStatusBar'a **WebNext** ve **Executor** için canlı health göstergeleri eklendi.

### Status Indicators

Status bar'da şu göstergeler görünür:

1. **API** - Backend API health (useHeartbeat)
2. **WS** - WebSocket connection (useWsHeartbeat)
3. **Engine** - Engine health (useEngineHealth)
4. **WebNext** - Next.js dev server health (port 3003) ⭐ YENİ
5. **Executor** - Executor service health (port 4001) ⭐ YENİ
6. **DEV** - Development mode (her zaman aktif)

### Nasıl Çalışır?

#### WebNext Health (`useWebNextHealth`)

- **Endpoint:** `/api/healthz` (Next.js'in kendi health endpoint'i)
- **Refresh:** 5 saniyede bir
- **Timeout:** 2 saniye
- **Durum:** Yeşil (ok) = Next.js dev server çalışıyor, Kırmızı (error) = Çalışmıyor

#### Executor Health (`useExecutorHealth`)

- **Endpoint:** `http://127.0.0.1:4001/healthz` (Executor'ın direkt health endpoint'i)
- **Refresh:** 5 saniyede bir
- **Timeout:** 2 saniye
- **CORS:** Executor'da CORS açık (`origin: true`)
- **Durum:** Yeşil (ok) = Executor çalışıyor, Kırmızı (error) = Çalışmıyor

### Görsel Gösterim

Her gösterge bir **StatusDot** komponenti kullanır:

- 🟢 **Yeşil nokta** = Servis çalışıyor
- 🔴 **Kırmızı nokta** = Servis çalışmıyor veya erişilemiyor

### Kullanım Senaryoları

1. **Reboot sonrası kontrol:**
   - Status bar'ı aç
   - WebNext ve Executor noktalarının yeşil olduğunu gör
   - Eğer kırmızıysa, daemon'ları kontrol et

2. **Crash tespiti:**
   - Status bar'da aniden kırmızıya dönen gösterge = servis düştü
   - Logları kontrol et: `tools\logs\webnext_daemon.log` veya `executor_daemon.log`

3. **Manuel başlatma sonrası:**
   - Daemon'u manuel başlattıktan sonra status bar'ın güncellenmesini bekle (5 saniye)
   - Yeşil nokta görünmeli

### Teknik Detaylar

**Hook'lar:**

- `apps/web-next/src/hooks/useWebNextHealth.ts` - WebNext health check
- `apps/web-next/src/hooks/useExecutorHealth.ts` - Executor health check

**Status Bar:**

- `apps/web-next/src/components/status-bar.tsx` - Ana status bar komponenti

**Refresh Mekanizması:**

- Her 5 saniyede bir otomatik refresh
- Focus/Reconnect'te de refresh
- SWR cache kullanımı (performans)

### Sorun Giderme

**WebNext kırmızı ama çalışıyor:**

- `/api/healthz` endpoint'i çalışıyor mu kontrol et
- Browser console'da CORS/network hataları var mı bak

**Executor kırmızı ama çalışıyor:**

- `http://127.0.0.1:4001/healthz` direkt erişilebilir mi test et
- Executor'da CORS ayarları doğru mu kontrol et (`origin: true`)
- Browser console'da CORS/network hataları var mı bak

**Her ikisi de kırmızı:**

- Daemon'lar çalışıyor mu kontrol et: `tools\HEALTH_BOTH.cmd`
- Port'lar dinliyor mu: `netstat -ano | findstr ":3003 :4001"`

### UI İyileştirmeleri (Eklenen)

✅ **Tooltip'ler** - Hover'da detaylı bilgi:

- Status (UP/DOWN)
- Latency (ms)
- Last OK time (ne zaman son başarılı ping)

✅ **Click-to-Open** - Tıklayınca health endpoint'i yeni sekmede açılır:

- WebNext: `/api/healthz`
- Executor: `http://127.0.0.1:4001/healthz`

✅ **Latency Gösterimi** - Yeşil nokta yanında latency görünür:

- WebNext: P95 latency (status bar metrics'ten)
- Executor: Direct latency (proxy endpoint'ten)

✅ **CORS Çözümü** - Executor için proxy endpoint:

- `/api/executor-healthz` → server-side fetch → CORS sorunu yok
- Client hep aynı origin'e vurur (127.0.0.1:3003)

### Test Komutları

```cmd
# Health endpoint'lerini test et
tools\TEST_HEALTH_ENDPOINTS.cmd

# Manuel test
# Browser'da aç:
http://127.0.0.1:3003/api/healthz
http://127.0.0.1:3003/api/executor-healthz
http://127.0.0.1:4001/healthz
```

### Gelecek İyileştirmeler

- [ ] Debounced toast (kırmızıya düşünce 1 kere uyarı, spam yok)
- [ ] Health history (son 5 dakika trend)
- [ ] Click'te log görüntüleme (daemon logları)
