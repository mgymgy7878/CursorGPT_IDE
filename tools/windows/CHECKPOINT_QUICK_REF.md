# Checkpoint Sistemi - Hızlı Referans

## 🎯 3 Parça Sistem

### 1. Otomatik Checkpoint (UI-Touch Tespiti)

**Kural:** UI dokunduysan checkpoint zorunlu, POST-CHECKPOINT mutlaka -VerifyUi ile atılır.

**Otomatik Tespit:**
- `apps/web-next/src/**`, `apps/web-next/app/**`, `apps/web-next/components/**`
- `apps/web-next/tailwind.*`, `apps/web-next/postcss.*`
- `apps/web-next/styles/**`, `apps/web-next/tokens/**`
- `apps/web-next/tests/e2e/**`
- `**/*.css`, `**/*.scss`, `**/tailwind.config.*`, `**/uiTokens.*`

**Kullanım:**
```powershell
# UI dokunuşu otomatik tespit edilir, -VerifyUi otomatik eklenir
.\tools\windows\checkpoint.ps1 -Message "POST: <task>"
```

### 2. Golden Master = Mühür

**Konsept:** UI doğru haldeyken golden master tag'i oluştur.

**Kullanım:**
```powershell
# UI doğru haldeyken golden master oluştur
.\tools\windows\golden-master.ps1 -Version "v1" -VerifyUi

# "Bok gibi oldu" anında geri dönüş
.\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"
```

### 3. Stable Worktree = Emniyet Kopyası

**Konsept:** Ana repo ne kadar karışırsa karışsın, stable worktree aç → "doğru UI" elinin altında.

**Kullanım:**
```powershell
# Stable worktree oluştur (son golden master'dan)
.\tools\windows\stable-worktree.ps1

# Stable worktree'i sil
.\tools\windows\stable-worktree.ps1 -Remove
```

## 📋 Günlük Akış (Kısa)

### Göreve Başla
```powershell
.\tools\windows\checkpoint.ps1 -Message "PRE: <task>"
```

### İş Bitince
```powershell
# UI dokunuşu varsa otomatik -VerifyUi eklenir
.\tools\windows\checkpoint.ps1 -Message "POST: <task>"
```

### Kötü Hissediyorsan / Kırılım Var
```powershell
# Son checkpoint'e dön
.\tools\windows\rollback.ps1

# En sağlam hal'e dönüş (golden master)
.\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"
```

## 🔄 Push Tags Standardı

**Kural:** Tag'ler sadece lokalde kalmasın, remote'a da push et.

**Otomatik:** Checkpoint script'i varsayılan olarak tag'leri push eder.

**Manuel Skip:**
```powershell
.\tools\windows\checkpoint.ps1 -Message "test" -NoPushTags
```

**Manuel Push:**
```powershell
git push && git push --tags
```

## 💡 Pratik Disiplin

**Her görev:**
1. PRE checkpoint (düz)
2. İş bitti: POST checkpoint (UI dokunuşu varsa otomatik VerifyUi)

**UI değilse:**
- POST VerifyUi şart değil ama yine de tag'le

**Gün sonu:**
```powershell
.\tools\windows\checkpoint.ps1 -Message "EOD" -Daily
git push && git push --tags
```

## 🎨 UI İşleri İçin Özel Akış

### 1. Golden Master Oluştur (UI Doğru Haldeyken)
```powershell
.\tools\windows\golden-master.ps1 -Version "v1" -VerifyUi
```

### 2. Stable Worktree Oluştur
```powershell
.\tools\windows\stable-worktree.ps1
```

### 3. Ana Repo'da Deney Yap
```powershell
# ... kod değişiklikleri ...
.\tools\windows\checkpoint.ps1 -Message "POST: <deney>"
```

### 4. Karşılaştırma İçin Stable Worktree'i Aç
```powershell
cd ../spark-stable
pnpm dev
```

### 5. "Bok Gibi Oldu" Anında Rollback
```powershell
cd ../CursorGPT_IDE
.\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"
```

## ✅ Bu Sistemin Güzelliği

- ✅ **Debug ederek geri kazanma değil** → **Etiketli doğruya dönüp ilerleme**
- ✅ **UI/UX işlerinde zaman kazandıran mühendislik ritüeli**
- ✅ **Sürümle, mühürle, geri al** → **Geleneksel ve doğru yaklaşım**
- ✅ **Otomatik refleks seviyesi** → **UI-touch otomatik tespit**

## 🚨 Kritik Notlar

1. **Tag'leri push et:** Checkpoint'ler sadece lokalde kalmasın
2. **Golden master oluştur:** UI doğru haldeyken mühürle
3. **Stable worktree kullan:** Ana repo'yu bozmadan deney yap
4. **UI dokunuşu = otomatik VerifyUi:** Script otomatik tespit eder

---

**Detaylı dokümantasyon:** `tools/windows/CHECKPOINT.md`
