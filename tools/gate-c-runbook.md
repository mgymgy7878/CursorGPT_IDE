# Gate C Smoke Test Runbook - Bugün Bitecek Şekilde

**Hedef:** 3 smoke testi koş, evidence dosyalarını PASS/FAIL ile doldur, Gate C PASS kararı ver.

**Süre:** ~30-45 dakika

---

## 0) Hazırlık (Tek Sefer - 5 dakika)

### Dev Server Başlat
```powershell
pnpm --filter web-next dev -- --port 3003
```

### Tarayıcı Aç
```
http://localhost:3003?debugLive=1
```

**Debug Badge Kontrolü:**
- Sağ alt köşede "Gate C Debug" badge görünmeli
- Şunları görmeyi hedefle:
  - `state` (connecting/streaming/done/idle)
  - `requestId`
  - `activeStreams` (kritik: dual panel testinde 1 kalacak)
  - `events/tokens/chars`

### Artifacts Klasörü Oluştur
```powershell
New-Item -ItemType Directory -Path artifacts/gateC -Force
```

**Klasör Yapısı:**
```
artifacts/gateC/
├── t1_network.png          # SMOKE-1 Network screenshot
├── t2_console.txt          # SMOKE-2 Console log
├── t3_limits.png           # SMOKE-3 Screenshot
└── netlog_gateC.json       # NetLog (opsiyonel)
```

---

## 1) SMOKE-1 — Dual Panel Single Stream

**Hedef:** Dock açıkken stream başlat, StatusBar aç/kapa → tek SSE request kanıtı

### Adımlar (5 dakika)

1. **CopilotDock'tan streaming başlat:**
   - Uzun cevap üretecek prompt: "Portföy durumunu detaylı açıkla ve risk analizi yap"
   - Stream başladığında debug badge'te `activeStreams: 1` görünmeli

2. **Streaming devam ederken:**
   - StatusBar panelini aç/kapat (veya ilgili widget'i görünür yap)
   - **ÖNEMLİ:** Yeni bir prompt gönderme, mevcut stream devam etsin

3. **DevTools → Network:**
   - Filter: `event-stream` veya `api/copilot/chat`
   - SSE request sayısını kontrol et

4. **Screenshot al:**
   - Network tab screenshot → `artifacts/gateC/t1_network.png`
   - Debug badge screenshot (opsiyonel ama faydalı)

### PASS Kriteri

✅ Network'te **tek SSE request** görünüyor
✅ Debug badge: `activeStreams=1` ve `requestId` sabit kalıyor
✅ StatusBar aç/kapa sonrası ikinci bağlantı yok

### Evidence Doldur

**Dosya:** `evidence/gateC_dual_panel_single_stream.txt`

**Metadata Header (ilk 10 satır):**
```
DateTime (TR): 2025-01-29 14:30:00
Machine: DESKTOP-XXXXX
OS: Windows 11
Browser: Edge 120.0.2210.91
Git Commit: abc123def456
Build Commit: [if available]
URL: http://localhost:3003?debugLive=1
SSE Endpoint: /api/copilot/chat
Test Name: Dual Panel Single Stream
Status: PASS
```

**Test Sonuçları:**
- SSE connection count: **1** ✅
- RequestId: `req_1738156200000_abc123`
- StatusBar aç/kapa: İkinci bağlantı oluşmadı ✅
- Debug badge: `activeStreams=1` sabit kaldı ✅

**Kanıtlar:**
- `artifacts/gateC/t1_network.png`
- (Opsiyonel) `artifacts/gateC/netlog_gateC.json`

---

## 2) SMOKE-2 — Abort Determinism

**Hedef:** Cancel → UI idle, error event yok

### Adımlar (5 dakika)

1. **Streaming başlat:**
   - CopilotDock'tan herhangi bir prompt gönder
   - Stream başladığında debug badge'te `state: streaming` görünmeli

2. **Streaming sırasında Cancel/Stop:**
   - Cancel butonuna tıkla (veya ilgili stop mekanizması)
   - **ÖNEMLİ:** Stream tamamen bitmeden önce cancel et

3. **Doğrula:**
   - Debug badge: `state` → `idle` (NOT `error`)
   - Console: AbortError için "error event" yok
   - Network: SSE kapanıyor (FIN/closed)

4. **Console log kopyala:**
   - Console'dan ilgili logları kopyala → `artifacts/gateC/t2_console.txt`

### PASS Kriteri

✅ Debug badge: `streaming` → `idle` (NOT `error`)
✅ Network: SSE kapanıyor (FIN/closed)
✅ Console: "error event" üretilmiyor (AbortError sadece kapanış)

### Evidence Doldur

**Dosya:** `evidence/gateC_abort_idle_no_error_event.txt`

**Metadata Header:** (aynı format)

**Test Sonuçları:**
- UI state after cancel: **idle** ✅ (NOT error)
- Console errors: AbortError yakalandı, error event üretilmedi ✅
- Network stream status: Closed (FIN) ✅
- Error events emitted: **0** ✅

**Kanıtlar:**
- `artifacts/gateC/t2_console.txt`
- (Opsiyonel) Server log tail

---

## 3) SMOKE-3 — Limits Enforce

**Hedef:** maxDuration/maxChars tetiklenince kontrollü kapanış

### Adımlar (10 dakika)

**Yöntem A: maxDuration (Önerilen - Deterministik)**

1. **Dev-only override ile başlat:**
   ```
   http://localhost:3003?debugLive=1&liveMaxDurationMs=5000
   ```
   - Bu URL ile sayfayı yenile
   - maxDuration = 5 saniye olacak

2. **Streaming başlat:**
   - Uzun cevap üretecek prompt: "Detaylı portföy analizi yap ve tüm stratejileri listele"
   - Stream başladığında debug badge'te `state: streaming` görünmeli

3. **5 saniye bekle:**
   - Stream otomatik kapanmalı
   - Debug badge: `state` → `error` veya `done` (limit aşıldı)

4. **Doğrula:**
   - Console: Limit exceeded error code görünmeli
   - Debug badge: Sayaçlar (tokens/events) görünmeli
   - Evidence log yazılmış olmalı

**Yöntem B: maxChars/maxTokens (Alternatif)**

1. **Dev-only override:**
   ```
   http://localhost:3003?debugLive=1&liveMaxChars=1000&liveMaxTokens=50
   ```
   - Çok kısa limitler set et
   - LLM davranışı değişken olabilir, bu yüzden maxDuration daha stabil

### PASS Kriteri

✅ Limit aşılınca stream kontrollü kapanır (`state` done/idle deterministik)
✅ "Hangi limit tetiklendi" kanıtlanır (log/evidence)
✅ Error code: `DURATION_LIMIT_EXCEEDED` / `CHAR_LIMIT_EXCEEDED` / `TOKEN_LIMIT_EXCEEDED`

### Evidence Doldur

**Dosya:** `evidence/gateC_limits_enforced.txt`

**Metadata Header:** (aynı format)

**Test Sonuçları:**
- Limit tested: **maxDuration** ✅
- Limit value: **5000ms** (dev override)
- Stream closure time: ~5 saniye sonra ✅
- Error code: **DURATION_LIMIT_EXCEEDED** ✅
- Evidence written: **YES** ✅

**Kanıtlar:**
- `artifacts/gateC/t3_limits.png` (screenshot)
- Console log (error code + sayaçlar)

---

## 4) NetLog Opsiyonu (SMOKE-1 için "Mahkemelik Kanıt")

**Opsiyonel ama çok güçlü kanıt**

### Adımlar

1. **NetLog script ile başlat:**
   ```powershell
   .\tools\gate-c-netlog.ps1
   ```
   - Script Edge/Chrome'u NetLog ile başlatacak
   - Bu instance'ı kullan

2. **SMOKE-1'i bu instance'ta koş:**
   - Dual panel testini yap
   - NetLog tüm network trafiğini kaydedecek

3. **NetLog dosyasını kaydet:**
   - Browser kapatıldığında NetLog finalize olur
   - Dosya: `artifacts/netlog/gateC_netlog_[timestamp].json`
   - Bunu `artifacts/gateC/netlog_gateC.json` olarak kopyala

4. **NetLog analiz:**
   - https://netlog-viewer.appspot.com/ aç
   - NetLog JSON'u upload et
   - Filter: `event-stream` veya `api/copilot/chat`
   - Tek SSE connection kanıtı

5. **Evidence'de referans ver:**
   - `evidence/gateC_dual_panel_single_stream.txt` içinde:
     - NetLog file: `artifacts/gateC/netlog_gateC.json`
     - NetLog viewer: [screenshot veya link]

---

## 5) Gate C PASS Kararı

**Gate C PASS demek için şu 5 şey tamam olmalı:**

✅ **3 evidence dosyası PASS:**
   - `evidence/gateC_dual_panel_single_stream.txt` → PASS + metadata header dolu
   - `evidence/gateC_abort_idle_no_error_event.txt` → PASS + metadata header dolu
   - `evidence/gateC_limits_enforced.txt` → PASS + metadata header dolu

✅ **En az 1 testte Network screenshot var:**
   - `artifacts/gateC/t1_network.png` (SMOKE-1)

✅ **Abort testinde "error event yok" kanıtlı:**
   - `artifacts/gateC/t2_console.txt` veya screenshot

✅ **Limit enforce davranışı kanıtlı:**
   - Dev-only override kullanıldıysa belirt
   - Error code + sayaçlar kanıtlı

✅ **Summary dosyası güncellendi:**
   - `evidence/gateC_smoke_test_summary.txt` içinde:
     - Kısa sonuç (3/3 PASS)
     - Artifact listesi
     - NetLog referansı (varsa)

---

## Hızlı Checklist

- [ ] Dev server çalışıyor (port 3003)
- [ ] Debug badge görünüyor (?debugLive=1)
- [ ] Artifacts klasörü oluşturuldu
- [ ] SMOKE-1: Dual panel test → PASS
- [ ] SMOKE-2: Abort test → PASS
- [ ] SMOKE-3: Limits test → PASS
- [ ] 3 evidence dosyası dolduruldu (metadata + PASS)
- [ ] Artifacts kaydedildi (screenshots/logs)
- [ ] Summary dosyası güncellendi

---

## Sorun Giderme

### Limit testi flakey olursa:
- Dev-only override kullan: `?debugLive=1&liveMaxDurationMs=5000`
- Bu prod'u etkilemez, sadece test için

### Debug badge görünmüyorsa:
- URL'de `?debugLive=1` var mı kontrol et
- Console'da: `localStorage.setItem('debugLive', 'true')` sonra refresh

### Network'te çift bağlantı görünüyorsa:
- Önceki stream'i cancel et
- Sayfayı yenile
- Tekrar test et

---

## Sonraki Adım: Gate D

Gate C PASS olduktan sonra:
- Drop/abort/stream_count metrikleri
- Prometheus/Grafana entegrasyonu
- Prod debugability dashboard
- Debug badge zaten UI yüzü olacak

