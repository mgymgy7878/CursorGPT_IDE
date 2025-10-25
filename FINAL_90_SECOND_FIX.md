# FINAL 90-SECOND FIX — Session 2025-10-25

**Durum:** ✅ Serviler ayakta, sadece `.env.local` eksik  
**Süre:** 90 saniye  
**Sonuç:** Dashboard tamamen çalışır halde

---

## Mevcut Durum

**Çalışan Servisler:**
```
✅ WS Server: Port 4001 (listening)
✅ Next.js: Port 3003 (ready)
```

**Problem:**
```
❌ .env.local yok
❌ NEXT_PUBLIC_* değişkenleri undefined
❌ API endpoint'ler timeout
```

---

## 90-Saniye Çözüm

### Adım 1: .env.local Oluştur (10 saniye)

```powershell
cd apps/web-next

@'
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml
'@ | Out-File .env.local -Encoding utf8 -Force

cat .env.local
```

**Beklenen çıktı:**
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml
```

---

### Adım 2: Next.js Restart (30 saniye)

**Terminal 2'de (pnpm dev çalışan):**

```powershell
# Ctrl+C ile durdur
# Sonra:
pnpm dev
```

**Beklenen çıktı:**
```
✓ Ready in ~25s
- Local: http://localhost:3003
- Environments: .env.local  ← Bu satır önemli!
```

---

### Adım 3: API Doğrulama (20 saniye)

```powershell
curl http://127.0.0.1:3003/api/public/engine-health
curl http://127.0.0.1:3003/api/public/error-budget
```

**Beklenen response:**
```json
{
  "status": "OK",
  "source": "mock",
  "updatedAt": "2025-10-25T...",
  ...
}
```

**✅ Eğer JSON geliyorsa → Başarılı!**

---

### Adım 4: Dashboard Test (30 saniye)

**Tarayıcıda aç:**
```
http://127.0.0.1:3003/dashboard
```

**Beklenen:**
- ✅ Sayfa yükleniyor (siyah error YOK)
- ✅ Status Bar üstte
- ✅ API: Yeşil dot
- ✅ WS: Yeşil dot  
- ✅ Engine: Yeşil dot

**Total: ~90 saniye**

---

## Sorun Giderme

### Hâlâ 500 / Timeout?

**Cache temizle ve yeniden başlat:**
```powershell
cd apps/web-next

If (Test-Path .next) { Remove-Item .next -Recurse -Force }
pnpm install
pnpm dev
```

---

### Port Çakışması?

**Farklı port kullan:**
```powershell
pnpm dev -- -p 3004
```

**Sonra aç:**
```
http://127.0.0.1:3004/dashboard
```

---

## Electron "js-yaml" Hatası (Ayrı Konu)

**Önemli:** Bu web-next'i ETKİLEMEZ.

**Kullanıcı Çözümü:**
1. Windows Ayarlar → Uygulamalar
2. "Spark Trading Desktop" → Kaldır
3. `%LocalAppData%\Programs\spark-trading-desktop` sil
4. Yeniden kur VEYA web arayüzünü kullan

**Geliştirici Çözümü:**
1. `pnpm add js-yaml` (dependencies'a)
2. electron-builder config kontrol et
3. Rebuild + repackage

**Detay:** `WEB_VS_ELECTRON_ISSUES.md`

---

## Final Validation Checklist

- [ ] `.env.local` oluşturuldu
- [ ] `cat .env.local` → 3 satır gösteriyor
- [ ] Next.js restart edildi
- [ ] Startup log'da "Environments: .env.local" var
- [ ] `/api/public/engine-health` → JSON döndü
- [ ] `/api/public/error-budget` → JSON döndü
- [ ] Dashboard yüklendi (http://127.0.0.1:3003/dashboard)
- [ ] Status bar tüm noktalar yeşil

**Hepsi ✅ ise → BAŞARILI!**

---

## Sonraki Adımlar

### 1. Real Backend'e Geçiş (İsteğe Bağlı)

**Backend servisleri çalıştır (4001 WS, 3001 Engine, 9090 Prometheus)**

**Sonra `.env.local`'a ekle:**
```
ENGINE_URL=http://127.0.0.1:3001
PROMETHEUS_URL=http://localhost:9090
```

**Restart:**
```powershell
pnpm dev
```

**Doğrula:**
```powershell
curl http://127.0.0.1:3003/api/public/engine-health
# "source": "real" (artık "mock" değil)
```

---

### 2. TypeScript Cleanup Sprint (Issue #11)

**Baseline oluştur:**
```powershell
pnpm -F web-next typecheck > evidence/ui/types-before.txt 2>&1
```

**Progress tracker:**
```powershell
pnpm type:delta
```

**Kickoff guide:**
```powershell
cat KICKOFF_GUIDE.md
```

---

## Özet

**Problem:** `.env.local` yok → NEXT_PUBLIC_* undefined → API timeout  
**Çözüm:** `.env.local` oluştur → Restart Next.js → 90 saniye  
**Sonuç:** Dashboard tamamen çalışır (mock mode)

**Electron hatası:** Ayrı concern, web'i etkilemez

---

**Session 2025-10-25 — FINAL FIX READY** 🚀

*Copy-paste yukarıdaki komutları → 90 saniyede dashboard açılır!*

