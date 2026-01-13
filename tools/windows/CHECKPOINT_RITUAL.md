# Checkpoint Sistemi - Standart Ritüel ve Otomasyon

## 🎯 Konsept: "Başa Dönmek" Yerine "Güvenli Hâle Işınlanmak"

**Sorun:** UI/UX işlerinde "başa dönmek" hissi insanı delirtir. Debug'la geri kazanmak zaman kaybıdır.

**Çözüm:** Etiketlenmiş güvenli hâle ışınlanmak. Sürümle → mühürle → geri al (klasik, sağlam, geleneksel mühendislik).

---

## 📋 Standart Ritüel: Her Görev = PRE + POST

### 1. Göreve Başlarken: PRE Checkpoint

**Komut:**
```powershell
# UI'dan (Command Palette - Ctrl+K)
Ctrl+K → "Checkpoint: PRE"

# Terminal'den
.\tools\windows\checkpoint.ps1 -Message "PRE: <task>"
```

**Ne Yapar:**
- Mevcut durumu checkpoint olarak kaydeder
- Tag oluşturur: `cp/YYYY-MM-DD_HH-mm-ss`
- Evidence dosyası kaydeder

### 2. İş Bitince: POST Checkpoint

**Komut:**
```powershell
# UI'dan (Command Palette - Ctrl+K)
Ctrl+K → "Checkpoint: POST (VerifyUi)"

# Terminal'den
.\tools\windows\checkpoint.ps1 -Message "POST: <task>"
# Not: UI dokunuşu varsa otomatik -VerifyUi eklenir
```

**Ne Yapar:**
- İş bitince checkpoint oluşturur
- UI dokunuşu varsa otomatik VerifyUi çalıştırır
- Tag oluşturur: `cp/YYYY-MM-DD_HH-mm-ss`
- Evidence dosyası kaydeder

### 3. İçin Rahat Etmezse: Rollback

**Komut:**
```powershell
# UI'dan (Command Palette - Ctrl+K)
Ctrl+K → "Rollback: Last Checkpoint"

# Terminal'den
.\tools\windows\rollback.ps1
```

**Ne Yapar:**
- Son checkpoint'e geri döner
- Uncommitted değişiklikleri otomatik stash eder
- Rescue branch oluşturur (`rescue/<timestamp>`)
- Kayıpsız rollback (emek yakma riski yok)

---

## 📅 Günlük Ritüel: EOD Checkpoint

**Her gün kapanış:**
```powershell
.\tools\windows\checkpoint.ps1 -Message "EOD" -Daily -VerifyUi
```

**Avantajlar:**
- ✅ Günlük "sigorta poliçesi"
- ✅ Ertesi gün bir şey saçmalarsa: `daily/...` tag'ine dön
- ✅ Günün "dönüş direği" olur

**Tag Formatı:**
- `daily/YYYY-MM-DD_HH-mm-ss`

---

## 🏆 Haftalık/İki Haftalık Ritüel: Golden Master

**UI "tam doğru" iken:**
```powershell
.\tools\windows\golden-master.ps1 -Version "v1" -VerifyUi
```

**En kötü senaryoda:**
```powershell
.\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"
```

**Avantajlar:**
- ✅ UI'ın "doğru halinin" mühürü
- ✅ Büyük kırılımda golden master'a dön
- ✅ Versiyon yönetimi: v1, v2, v3...

**Tag Formatı:**
- `ui/golden-master/v1`
- `ui/golden-master/v2`
- ...

---

## 🛡️ Sürekli Emniyet Kemeri: Stable Worktree

**Ana repo ne kadar karışırsa karışsın "temiz kopya" elinin altında:**
```powershell
.\tools\windows\stable-worktree.ps1
```

**Kullanım:**
- Ana repo = deney alanı
- `../spark-stable` = çalışan doğru hal
- Karşılaştırma için stable worktree'i aç

**Avantajlar:**
- ✅ Stable sürüm her zaman erişilebilir
- ✅ Karşılaştırma kolay
- ✅ Hızlı kaçış mümkün

---

## ⌨️ UI'dan Tek Tuşla: Command Palette "Panik Butonu"

**Komutlar:**
- `Ctrl+K` → "Checkpoint: PRE"
- `Ctrl+K` → "Checkpoint: POST (VerifyUi)"
- `Ctrl+K` → "Rollback: Last Checkpoint"
- `Ctrl+K` → "Rollback: Golden Master"

**Avantajlar:**
- ✅ Terminal'e gitmeye gerek yok
- ✅ Tek tıkla checkpoint/rollback
- ✅ Onay ekranları ile güvenli
- ✅ SSR-safe, Windows odaklı

---

## 📊 StatusBar Rozeti: "Checkpoint Atmayı Unuttun Mu?"

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

**Renk Kodlaması:**
- 🟢 **Yeşil:** Temiz (dirty yok)
- 🟡 **Sarı:** Dirty (uncommitted changes)
- 🟠 **Turuncu:** UI-touch (UI dosyaları değişmiş)

---

## 🤖 Cursor İş Akışı Şablonu

**Her görevde Cursor'a yapıştır:**

```
chatgpt: KURAL (ZORUNLU):
1) İşe başlamadan PRE checkpoint:
   powershell: .\tools\windows\checkpoint.ps1 -Message "PRE: <task>"
2) İş bitince POST checkpoint:
   powershell: .\tools\windows\checkpoint.ps1 -Message "POST: <task>"
   (UI-touch varsa script otomatik -VerifyUi çalıştıracak)

Rollback planı:
- UI bozulursa: .\tools\windows\rollback.ps1
- Büyük kırılım: .\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"

ÇIKTI: FINAL SUMMARY içinde oluşan tag adlarını yaz.
```

**Alternatif (UI'dan):**
```
chatgpt: KURAL (ZORUNLU):
1) İşe başlamadan PRE checkpoint:
   Command Palette (Ctrl+K) → "Checkpoint: PRE"
2) İş bitince POST checkpoint:
   Command Palette (Ctrl+K) → "Checkpoint: POST (VerifyUi)"
   (UI-touch varsa otomatik -VerifyUi çalıştırılır)

Rollback planı:
- UI bozulursa: Command Palette → "Rollback: Last Checkpoint"
- Büyük kırılım: Command Palette → "Rollback: Golden Master"

ÇIKTI: FINAL SUMMARY içinde oluşan tag adlarını yaz.
```

---

## 🔄 Kayıpsız Rollback Refleksi

**Rollback artık "korkusuz":**

✅ Değişikliklerin stash'leniyor (`rollback-backup-<timestamp>-<branch>`)
✅ Ayrıca rescue branch oluşuyor (`rescue/<timestamp>`)
✅ "Geri aldım ama emek gitti mi?" kaygısı bitiyor

**Stash'i Geri Almak:**
```powershell
git stash list
git stash apply stash@{0}
```

**Rescue Branch'i Geri Almak:**
```powershell
git checkout rescue/2026-01-13_18-30-00
```

---

## 📈 Ritüel Zaman Çizelgesi

### Her Görev
1. **PRE checkpoint** (işe başlamadan)
2. **İş yap**
3. **POST checkpoint** (iş bitince)
4. **Rollback** (gerekirse)

### Her Gün
1. **EOD checkpoint** (gün sonu)
   ```powershell
   .\tools\windows\checkpoint.ps1 -Message "EOD" -Daily -VerifyUi
   ```

### Her Hafta/İki Hafta
1. **Golden master** (UI doğru haldeyken)
   ```powershell
   .\tools\windows\golden-master.ps1 -Version "v1" -VerifyUi
   ```
2. **Stable worktree** (gerekirse)
   ```powershell
   .\tools\windows\stable-worktree.ps1
   ```

---

## ✅ Bu Sistemin Güzelliği

**Önceki Durum:**
- ❌ "Başa dönmek" hissi
- ❌ Debug'la geri kazanma
- ❌ Zaman kaybı
- ❌ Sinir krizi

**Yeni Durum:**
- ✅ Etiketlenmiş güvenli hâle ışınlanmak
- ✅ Sürümle → mühürle → geri al
- ✅ Debug zamanı yerine üretim zamanı
- ✅ Klasik, sağlam, geleneksel mühendislik

**Sonuç:**
- ✅ "Başa dönmek" yerine "güvenli hâle ışınlanmak"
- ✅ Ritüel + otomasyon seviyesine kilitlendi
- ✅ Her görev için otomatik geri dönüş noktası
- ✅ UI/UX işlerinde zaman kazandıran mühendislik ritüeli

---

**Detaylı Dokümantasyon:**
- `tools/windows/CHECKPOINT.md` - Tam dokümantasyon
- `tools/windows/CHECKPOINT_QUICK_REF.md` - Hızlı referans
- `tools/windows/CHECKPOINT_IMPROVEMENTS.md` - İyileştirmeler
- `tools/windows/CHECKPOINT_ACCEPTANCE_TESTS.md` - Kabul testleri
