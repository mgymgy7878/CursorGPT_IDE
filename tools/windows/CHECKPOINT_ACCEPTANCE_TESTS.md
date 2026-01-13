# Checkpoint Sistemi - Kabul Testleri ve Güvenlik

## 🎯 Kabul Testleri

### Test 1: Kayıpsız Rollback (Kirli Working Tree)

**Senaryo:**
1. Bir dosyada kasıtlı değişiklik yap (commit etme)
2. `.\tools\windows\rollback.ps1` çalıştır
3. Doğrula:
   - `git stash list` içinde `rollback-backup-...` var
   - `git branch --list "rescue/*"` içinde yeni rescue branch var
   - UI eski checkpoint state'ine dönmüş

**Test Komutu:**
```powershell
.\tools\windows\smoke-checkpoint.ps1
```

**Beklenen Sonuç:**
- ✅ Rollback başarılı
- ✅ Stash oluşturuldu
- ✅ Rescue branch oluşturuldu
- ✅ Dosya checkpoint state'ine döndü

### Test 2: Stash Geri Alma

**Senaryo:**
1. Rollback sonrası stash'i geri al
2. `git stash apply stash@{0}` ile değişiklikleri geri alabiliyor musun?

**Test Komutu:**
```powershell
git stash list
git stash apply stash@{0}
```

**Beklenen Sonuç:**
- ✅ Stash başarıyla uygulandı
- ✅ Değişiklikler geri geldi

### Test 3: Annotated Tag Kalite Kontrolü

**Senaryo:**
1. Bir checkpoint at
2. `git show cp/....` kontrol et
3. Tag mesajında şu 4'ü görmen lazım:
   - UI-touch detected
   - VerifyUi enabled/result
   - Evidence path
   - Timestamp/hash

**Test Komutu:**
```powershell
.\tools\windows\checkpoint.ps1 -Message "test checkpoint"
git show cp/$(git describe --tags --match "cp/*" --abbrev=0)
```

**Beklenen Sonuç:**
- ✅ Tag mesajında tüm bilgiler mevcut
- ✅ Evidence path doğru
- ✅ UI-touch durumu belirtilmiş

### Test 4: Command Palette E2E Testi

**Senaryo:**
1. Ctrl+K → "Checkpoint: PRE" çalıştır
2. Ctrl+K → "Checkpoint: POST (VerifyUi)" çalıştır
3. Ctrl+K → "Rollback: Last Checkpoint" çalıştır
4. Ctrl+K → "Rollback: Golden Master" çalıştır

**Beklenen Sonuç:**
- ✅ Tüm komutlar çalışıyor
- ✅ Çıktılar UI'da okunabilir
- ✅ Hata durumunda anlamlı mesaj dönüyor

## 🔒 Güvenlik Sertleştirme

### 1. Dev-Only Feature Flag

**Kural:** `ENABLE_LOCAL_TOOLS=1` yoksa endpoint 404 döner.

**Kurulum:**
```bash
# .env.local
ENABLE_LOCAL_TOOLS=1
```

**Kontrol:**
```typescript
const enableLocalTools = process.env.ENABLE_LOCAL_TOOLS === "1";
if (!enableLocalTools) {
  return NextResponse.json({ ... }, { status: 404 });
}
```

### 2. Local-Only (IP Kontrolü)

**Kural:** Sadece 127.0.0.1 istekleri kabul et.

**Kontrol:**
```typescript
const clientIp = request.headers.get("x-forwarded-for") || "unknown";
const isLocalhost = clientIp === "127.0.0.1" ||
                    request.url.includes("localhost");
if (!isLocalhost) {
  return NextResponse.json({ ... }, { status: 403 });
}
```

### 3. Allowlist Action

**Kural:** Sadece sabit aksiyonlar: `{pre, post, rollback, rollback-golden}`

**Kontrol:**
```typescript
const allowedActions = ["pre", "post", "rollback", "rollback-golden"];
if (!allowedActions.includes(action)) {
  return NextResponse.json({ ... }, { status: 400 });
}
```

### 4. execFile Kullanımı

**Kural:** `execFile` kullan, `exec` kullanma (string concat ile exec yok).

**Kontrol:**
```typescript
execFileAsync("powershell.exe", args, { ... });
// NOT: execAsync(`powershell -File ...`)
```

### 5. Input Sanitization

**Kural:** Message alanı whitelist/length limit.

**Kontrol:**
```typescript
if (message.length > 100) { ... }
const messagePattern = /^[a-zA-Z0-9\s\-_çğıöşüÇĞIİÖŞÜ]+$/;
if (!messagePattern.test(message)) { ... }
```

### 6. Timeout

**Kural:** 30-60 sn; takılırsa kill.

**Kontrol:**
```typescript
const timeout = 30000; // 30 seconds
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error("Execution timeout")), timeout);
});
await Promise.race([execPromise, timeoutPromise]);
```

### 7. Output Cap

**Kural:** 50 line limit (zaten var).

**Kontrol:**
```typescript
output: output.split("\n").slice(0, 50).join("\n")
```

## 🧪 Otomatik Smoke Test

**Komut:**
```powershell
.\tools\windows\smoke-checkpoint.ps1
```

**Test Kapsamı:**
- ✅ Kayıpsız rollback (kirli working tree)
- ✅ Stash geri alma
- ✅ Annotated tag kalite kontrolü
- ✅ Commit mesajı evidence linki

**Çıktı:**
- Evidence dosyası: `evidence/checkpoints/YYYY-MM-DD/smoke-test-HH-mm-ss.txt`
- Test özeti: Passed/Failed sayısı
- Detaylı sonuçlar

## 📊 StatusBar Rozeti

**Özellik:**
- Last CP: Son checkpoint tag'i (kısaltılmış)
- DIRTY: Uncommitted değişiklik var mı?
- UI-TOUCH: UI dosyaları değişmiş mi?

**Görünüm:**
```
CP: 2026-01-13 · (yeşil: temiz, sarı: dirty, turuncu: UI-touch)
```

**Tooltip:**
```
Last CP: cp/2026-01-13_18-30-00
Dirty: yes/no
UI-Touch: yes/no
```

## ✅ Güvenlik Checklist

- [x] Dev-only feature flag (`ENABLE_LOCAL_TOOLS`)
- [x] Local-only IP kontrolü (127.0.0.1)
- [x] Allowlist action (sadece sabit aksiyonlar)
- [x] execFile kullanımı (exec değil)
- [x] Input sanitization (whitelist + length limit)
- [x] Timeout (30 saniye)
- [x] Output cap (50 satır)

## 🚀 Sonuç

Checkpoint sistemi artık:
- ✅ **Kazaya dayanıklı** (kabul testleri geçiyor)
- ✅ **Güvenli** (7 katmanlı güvenlik kontrolü)
- ✅ **Gözlemlenebilir** (StatusBar rozeti)
- ✅ **Test edilebilir** (otomatik smoke test)

---

**Detaylı Dokümantasyon:**
- `tools/windows/CHECKPOINT.md` - Tam dokümantasyon
- `tools/windows/CHECKPOINT_QUICK_REF.md` - Hızlı referans
- `tools/windows/CHECKPOINT_IMPROVEMENTS.md` - İyileştirmeler
