# Local Dev Troubleshooting

## 🔴 ERR_CONNECTION_REFUSED (Port 3003)

### Hızlı Teşhis

**PowerShell'de port kontrolü:**
```powershell
netstat -ano | findstr :3003
```

**Sonuçlar:**
- **Hiç çıktı yoksa:** Panel hiç başlamamış / crash olmuş
- **LISTENING varsa:** Doğru portta bir şey var, log'a bakmak gerekir (ama "refused" genelde LISTENING yokken olur)

### Çözüm Adımları

#### 1. Panel Başlatma
```powershell
# Repo kökünde
pnpm --filter web-next dev -- --port 3003
```

#### 2. Port Doluysa (PID Öldürme)
```powershell
# PID'yi bul
netstat -ano | findstr :3003

# PID'yi öldür (örnek: PID 12345)
taskkill /PID 12345 /F
```

#### 3. Doğrulama
Tarayıcıda test et:
- `http://127.0.0.1:3003/` (path önemli değil; önce port)
- Eğer açılıyorsa → Port çalışıyor
- Eğer hala refused → Terminal log'unda crash/exception bak

### Yaygın Sorunlar

1. **Panel crash olmuş:**
   - Terminal log'unda error mesajı var mı?
   - `pnpm --filter web-next typecheck` çalıştır (type error var mı?)

2. **Port çakışması:**
   - Başka bir process 3003'ü kullanıyor mu?
   - `netstat -ano | findstr :3003` ile PID bul → `taskkill /PID <PID> /F`

3. **Yanlış port:**
   - `.env.local` veya `package.json`'da port ayarı kontrol et
   - `--port 3003` flag'i doğru mu?

---

**Son Güncelleme:** 2025-01-29

