# Checkpoint & Rollback Sistemi

## Konsept

Her riskli UI değişikliğinden sonra checkpoint oluştur, sorun olursa hızlıca geri dön.

**3 Katmanlı Geri Dönüş Noktası Standardı:**

1. **Mikro Checkpoint**: Her riskli hamleden sonra
2. **Günlük Checkpoint**: Gün sonu
3. **Golden Master**: UI'ın doğru halinin mühürü

**Otomatik UI-Touch Tespiti:**

Checkpoint script'i artık otomatik olarak UI dokunuşunu tespit eder ve `-VerifyUi` flag'ini otomatik ekler. UI dokunuşu tanımı:

- `apps/web-next/src/**`
- `apps/web-next/app/**`
- `apps/web-next/components/**`
- `apps/web-next/tailwind.*`
- `apps/web-next/postcss.*`
- `apps/web-next/styles/**`
- `apps/web-next/tokens/**`
- `apps/web-next/tests/e2e/**`
- `**/*.css`, `**/*.scss`
- `**/tailwind.config.*`
- `**/uiTokens.*`

**Golden Master Yaklaşımı:**

- Doğru hal = etiketli commit
- "Bok gibi oldu" anında geri dönüş: son cp tag'ine reset
- Figma'daki doğru ekranlar = teknik referans

## 3 Katmanlı Geri Dönüş Noktası Standardı

### A) Mikro Checkpoint (HER Riskli Hamleden Sonra)

**Ne zaman kullan:**

- UI layout, modal, sidebar, theme, state, routing, chart, command palette vb. dokunduysan
- Değişiklik küçük bile olsa, riskli ise checkpoint

**Kural:** "Değişiklik küçük bile olsa, riskli ise checkpoint."

**Komut:**

```powershell
.\tools\windows\checkpoint.ps1 -Message "UI: <ne yaptım>"
```

**UI'ya dokunduysan kanıtlı:**

```powershell
.\tools\windows\checkpoint.ps1 -Message "UI: <ne yaptım>" -VerifyUi
```

**Örnekler:**

```powershell
.\tools\windows\checkpoint.ps1 -Message "UI: command palette portal fix"
.\tools\windows\checkpoint.ps1 -Message "UI: status bar feed pill" -VerifyUi
.\tools\windows\checkpoint.ps1 -Message "UI: dark theme consistency" -VerifyUi
```

### B) Günlük Checkpoint (GÜN SONU)

**Ne zaman kullan:**

- Her günün sonunda
- Tüm değişiklikler commit edildikten sonra

**Komut:**

```powershell
.\tools\windows\checkpoint.ps1 -Message "EOD" -Daily -VerifyUi
```

**Avantajlar:**

- Günün "dönüş direği" olur
- Büyük kırılımda günün başına dönebilirsin
- Daily tag ile kolay bulunur

### C) Golden Master ("Doğru Hal" Mühürleme)

**Konsept:**
UI doğru haldeyken golden master tag'i oluştur, büyük kırılmada bu tag'e dön.

**Kullanım:**

```powershell
# UI doğru haldeyken golden master oluştur
.\tools\windows\golden-master.ps1 -Version "v1" -VerifyUi

# UI doğrulama olmadan (hızlı)
.\tools\windows\golden-master.ps1 -Version "v1"

# Tag'leri push etme (varsayılan: push eder)
.\tools\windows\golden-master.ps1 -Version "v1" -NoPushTags
```

**Büyük kırılmada golden master'a dön:**

```powershell
.\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"
```

**Kritik Detay:**

- ✅ Tag'ler otomatik olarak remote'a push edilir (varsayılan)
- ✅ Golden master = teknik referans + görsel referans
- ✅ Her golden master versiyonu için ayrı tag: `ui/golden-master/v1`, `v2`, vb.

## Kullanım

### Mikro Checkpoint (Her Riskli Hamle Sonrası)

```powershell
.\tools\windows\checkpoint.ps1 -Message "command palette portal fix"
```

**Ne zaman kullan:**

- UI component değişikliği
- Styling değişikliği
- Layout değişikliği
- Command Palette, Modal, Dialog gibi kritik UI elementleri

### Kanıtlı Checkpoint (UI Guardrails ile)

```powershell
.\tools\windows\checkpoint.ps1 -Message "status bar feed pill" -VerifyUi
```

**Ne zaman kullan:**

- UI değişikliği yaptıysan
- Token lockdown ve visual smoke test çalıştırmak istiyorsan
- Production'a geçmeden önce doğrulama

**Ne yapar:**

- `pnpm check:ui-tokens` çalıştırır
- `pnpm ui:test:visual` çalıştırır
- Başarısız olsa bile checkpoint oluşturur (non-blocking)

### Günlük Checkpoint (Gün Sonu)

```powershell
.\tools\windows\checkpoint.ps1 -Message "end of day" -Daily
```

**Ne zaman kullan:**

- Günün sonunda
- Tüm değişiklikler commit edildikten sonra
- Daily tag ile işaretlenir (`daily/2026-01-13_17-39-00`)

### "Panik Butonu": 10 Saniyede Geri Dönüş

### Son Checkpoint'e Dön

**Son checkpoint'e dön:**

```powershell
.\tools\windows\rollback.ps1
```

**Belirli bir tag'e dön:**

```powershell
.\tools\windows\rollback.ps1 -Tag "cp/2026-01-13_17-39-00"
```

**Çok kötü durumda (manuel, sert reset) — dikkat: uncommitted gider:**

```powershell
git reset --hard cp/2026-01-13_17-39-00
git clean -fd
```

**Checkpoint listesi:**

```powershell
git tag --list "cp/*" --sort=-creatordate
git tag --list "daily/*" --sort=-creatordate
git tag --list "ui/golden-master/*" --sort=-creatordate
```

## Aynı Anda 2 Dünya: Worktree ile "Stable" Kopya

**Konsept:**
UI'yı kurcalarken bir yandan stable sürüm ayrı klasörde dursun. Ana repo ne kadar karışırsa karışsın, stable worktree aç → "doğru UI" elinin altında.

**Kullanım:**

```powershell
# Son golden master'dan stable worktree oluştur
.\tools\windows\stable-worktree.ps1

# Belirli golden master tag'inden oluştur
.\tools\windows\stable-worktree.ps1 -Tag "ui/golden-master/v1"

# Stable worktree'i sil
.\tools\windows\stable-worktree.ps1 -Remove
```

**Avantajlar:**

- ✅ Stable sürüm her zaman erişilebilir (`../spark-stable`)
- ✅ Ana repo = deney alanı
- ✅ Karşılaştırma kolay
- ✅ Hızlı kaçış mümkün
- ✅ Ana repo'yu bozmadan deney yapabilirsin

**Workflow:**

```powershell
# 1. Golden master oluştur (UI doğru haldeyken)
.\tools\windows\golden-master.ps1 -Version "v1" -VerifyUi

# 2. Stable worktree oluştur
.\tools\windows\stable-worktree.ps1

# 3. Ana repo'da deney yap
# ... kod değişiklikleri ...

# 4. Karşılaştırma için stable worktree'i aç
cd ../spark-stable
pnpm dev

# 5. "Bok gibi oldu" anında rollback
cd ../CursorGPT_IDE
.\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"
```

## Checkpoint Yapısı

### Tag Formatı

- **Mikro checkpoint**: `cp/2026-01-13_17-39-00` (annotated)
- **Günlük checkpoint**: `daily/2026-01-13_17-39-00` (annotated)

**Annotated Tag İçeriği:**

- Görev mesajı
- UI-touch detected mı
- VerifyUi sonucu (pass/fail/partial)
- Evidence dosya yolu
- Hash ve timestamp

**Commit Mesajı:**

- Evidence linki commit mesajının sonuna eklenir
- Format: `Evidence: evidence/checkpoints/2026-01-13/....txt`

### Evidence Dosyaları

Checkpoint'ler `evidence/checkpoints/YYYY-MM-DD/` klasörüne kaydedilir:

```
evidence/checkpoints/2026-01-13/2026-01-13_17-39-00.txt
```

**İçerik:**

- Timestamp
- Tag
- Hash
- Commit message
- Git status
- Diff stat
- Changed files

## Workflow Örnekleri

### Senaryo 1: Command Palette Fix

```powershell
# 1. Değişiklikleri yap
# ... kod değişiklikleri ...

# 2. Checkpoint oluştur
.\tools\windows\checkpoint.ps1 -Message "command palette portal fix"

# 3. Test et
# ... tarayıcıda test ...

# 4. Sorun varsa geri dön
.\tools\windows\rollback.ps1
```

### Senaryo 2: UI Değişikliği + Guardrails

```powershell
# 1. UI değişikliği yap
# ... kod değişiklikleri ...

# 2. Kanıtlı checkpoint (guardrails ile)
.\tools\windows\checkpoint.ps1 -Message "status bar feed pill" -VerifyUi

# 3. Guardrails başarısız olursa geri dön
.\tools\windows\rollback.ps1
```

### Senaryo 3: Gün Sonu

```powershell
# 1. Tüm değişiklikleri commit et
git add -A
git commit -m "feat: new feature"

# 2. Günlük checkpoint
.\tools\windows\checkpoint.ps1 -Message "end of day" -Daily

# 3. Yarın sorun olursa geri dön
.\tools\windows\rollback.ps1 -Tag "daily/2026-01-13_17-39-00"
```

## Golden Master Referansı

### Figma Export'ları

Figma'daki doğru ekranları `docs/figma/golden_master/*.png` olarak export et:

```powershell
# Golden master'ı ilk kez ekle
git add docs/figma/golden_master/*.png
git commit -m "docs: add golden master screenshots"
git tag ui/golden-master/v1
```

### Checkpoint ile Golden Master

Checkpoint'ler golden master referansı olarak kullanılabilir:

```powershell
# UI doğru haldeyken checkpoint oluştur
.\tools\windows\checkpoint.ps1 -Message "golden master state" -VerifyUi

# Sorun olursa golden master'a dön
.\tools\windows\rollback.ps1 -Tag "cp/2026-01-13_17-39-00"
```

## Standart Ritüel: Her Görev = PRE + POST (Teleport Noktası)

**Konsept:** Her görev için otomatik geri dönüş noktası oluştur. "Başa dönmek" yerine "etiketlenmiş güvenli hâle ışınlanmak".

### Ritüel Adımları

**1. Göreve Başlarken:**

```powershell
# Command Palette: Ctrl+K → "Checkpoint: PRE"
# Veya terminal:
.\tools\windows\checkpoint.ps1 -Message "PRE: <task>"
```

**2. İş Bitince:**

```powershell
# Command Palette: Ctrl+K → "Checkpoint: POST (VerifyUi)"
# Veya terminal:
.\tools\windows\checkpoint.ps1 -Message "POST: <task>"
# Not: UI dokunuşu varsa otomatik -VerifyUi eklenir
```

**3. İçin Rahat Etmezse:**

```powershell
# Command Palette: Ctrl+K → "Rollback: Last Checkpoint"
# Veya terminal:
.\tools\windows\rollback.ps1
# Kayıpsız: stash + rescue branch otomatik oluşturulur
```

### Günlük Geri Dönüş Noktası (EOD)

**Her gün kapanış:**

```powershell
.\tools\windows\checkpoint.ps1 -Message "EOD" -Daily -VerifyUi
```

**Avantajlar:**

- ✅ Günlük "sigorta poliçesi"
- ✅ Ertesi gün bir şey saçmalarsa: `daily/...` tag'ine dön
- ✅ Günün "dönüş direği" olur

### Haftalık/İki Haftalık "Doğru UI" Mühürü

**UI "tam doğru" iken:**

```powershell
.\tools\windows\golden-master.ps1 -Version "v1" -VerifyUi
```

**En kötü senaryoda:**

```powershell
.\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"
```

### Sürekli Emniyet Kemeri: Stable Worktree

**Ana repo ne kadar karışırsa karışsın "temiz kopya" elinin altında:**

```powershell
.\tools\windows\stable-worktree.ps1
```

**Kullanım:**

- Ana repo = deney alanı
- `../spark-stable` = çalışan doğru hal
- Karşılaştırma için stable worktree'i aç

## Cursor İş Akışına "Zorunlu PRE/POST" Şablonu

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

### Pre/Post Otomasyonu (Cursor Akışına Sabitlendi)

**UI'dan Panik Butonu:**

Command Palette (Ctrl+K) içinde:

- ✅ **Checkpoint: PRE** - İşe başlamadan checkpoint
- ✅ **Checkpoint: POST (VerifyUi)** - İş bitince checkpoint
- ✅ **Rollback: Last Checkpoint** - Son checkpoint'e dön
- ✅ **Rollback: Golden Master** - Golden master'a dön

**StatusBar Rozeti:**

- Last CP: Son checkpoint tag'i (kısaltılmış)
- DIRTY: Uncommitted değişiklik var mı?
- UI-TOUCH: UI dosyaları değişmiş mi?
- "Checkpoint atmayı unuttun mu?" diye bağırıyor

**Avantajlar:**

- ✅ Terminal'e gitmeye gerek yok
- ✅ Tek tıkla checkpoint/rollback
- ✅ Onay ekranları ile güvenli
- ✅ SSR-safe, Windows odaklı

**UI'dan Panik Butonu:**

Command Palette (Ctrl+K) içinde:

- ✅ **Checkpoint: PRE** - İşe başlamadan checkpoint
- ✅ **Checkpoint: POST (VerifyUi)** - İş bitince checkpoint
- ✅ **Rollback: Last Checkpoint** - Son checkpoint'e dön
- ✅ **Rollback: Golden Master** - Golden master'a dön

**Avantajlar:**

- ✅ Terminal'e gitmeye gerek yok
- ✅ Tek tıkla checkpoint/rollback
- ✅ Onay ekranları ile güvenli
- ✅ SSR-safe, Windows odaklı

**Otomatik UI-Touch Tespiti:**

Checkpoint script'i artık otomatik olarak UI dokunuşunu tespit eder:

- UI dosyaları değiştiyse → Otomatik `-VerifyUi` eklenir
- UI dokunuşu yoksa → Normal checkpoint oluşturulur
- Manuel `-VerifyUi` flag'i ile override edilebilir

**Örnek Kullanım:**

```
KURAL: Bu görevde iki checkpoint zorunlu.
1) PRE-CHECKPOINT (işe başlamadan)
   - powershell: .\tools\windows\checkpoint.ps1 -Message "PRE: command palette portal fix"
2) POST-CHECKPOINT (iş bitince, smoke + ui guard)
   - powershell: .\tools\windows\checkpoint.ps1 -Message "POST: command palette portal fix" -VerifyUi

Rollback planı:
- Eğer UI/UX bozulursa: .\tools\windows\rollback.ps1 (son checkpoint)
- Eğer büyük kırılım varsa: daily/2026-01-13_17-39-00 tag'ine dön.
```

**Avantajlar:**

- ✅ Her görevde otomatik dönüş noktası
- ✅ PRE/POST checkpoint ile güvenli deney
- ✅ UI guardrails entegrasyonu
- ✅ Rollback planı önceden belirlenmiş

## Mini Kural Seti

### ✅ Yapılması Gerekenler

1. **Her riskli UI hamlesi = checkpoint** (UI-touch otomatik tespit edilir)
2. **Gün sonu = daily checkpoint**
3. **Golden master = UI'ın doğru halinin mühürü** (`golden-master.ps1` ile)
4. **Tag'leri push et** (Otomatik, `-NoPushTags` ile skip edilebilir)
5. **Büyük refactor/deney = stable worktree kullan** (`stable-worktree.ps1` ile)
6. **Gün sonunda:** `git push && git push --tags` (checkpoint script otomatik push eder)

### ❌ Yapılmaması Gerekenler

1. **Her küçük değişiklik için checkpoint oluşturma** (sadece riskli olanlar için)
2. **Checkpoint'leri silme** (geçmiş referans olarak kalmalı)
3. **Rollback'i dikkatsizce kullanma** (uncommitted changes kaybolur)
4. **Tag'leri push etmeyi unutma** (remote'da yedek olmalı)

### 🎯 Sonuç

Bu sistemle "arayüz bok gibi oldu" anı, dramatik bir gün değil: **tek komutluk geri sarma** oluyor. Debug yerine ilerleme yapıyorsun.

## Best Practices

### ✅ Yapılması Gerekenler

1. **Her riskli UI değişikliğinden sonra checkpoint oluştur**
2. **UI değişikliği yaptıysan `-VerifyUi` kullan**
3. **Gün sonunda daily checkpoint oluştur**
4. **Checkpoint mesajlarını açıklayıcı yap**

### ❌ Yapılmaması Gerekenler

1. **Her küçük değişiklik için checkpoint oluşturma** (sadece riskli olanlar için)
2. **Checkpoint'leri silme** (geçmiş referans olarak kalmalı)
3. **Rollback'i dikkatsizce kullanma** (uncommitted changes kaybolur)

## Troubleshooting

### Checkpoint Oluşturulamıyor

```powershell
# Değişiklik var mı kontrol et
git status

# Git repo mu kontrol et
git rev-parse --git-dir
```

### Rollback Çalışmıyor

```powershell
# Tag var mı kontrol et
git tag --list "cp/*"

# Tag detayları
git show cp/2026-01-13_17-39-00
```

### Evidence Dosyası Oluşmuyor

```powershell
# Evidence klasörü var mı kontrol et
Test-Path evidence\checkpoints

# Manuel oluştur
New-Item -ItemType Directory -Force -Path evidence\checkpoints
```

## Otomatik UI-Touch Tespiti

Checkpoint script'i artık otomatik olarak UI dokunuşunu tespit eder:

**UI-Touch Tanımı:**

- `apps/web-next/src/**`
- `apps/web-next/app/**`
- `apps/web-next/components/**`
- `apps/web-next/tailwind.*`, `apps/web-next/postcss.*`
- `apps/web-next/styles/**`, `apps/web-next/tokens/**`
- `apps/web-next/tests/e2e/**`
- `**/*.css`, `**/*.scss`
- `**/tailwind.config.*`, `**/uiTokens.*`

**Otomatik Davranış:**

- UI dokunuşu tespit edilirse → Otomatik `-VerifyUi` eklenir
- UI dokunuşu yoksa → Normal checkpoint oluşturulur
- Manuel `-VerifyUi` flag'i ile override edilebilir

**Örnek:**

```powershell
# UI dosyası değiştirdin (örn: components/Button.tsx)
.\tools\windows\checkpoint.ps1 -Message "fix button styling"
# → Otomatik olarak -VerifyUi eklenir ve UI guardrails çalıştırılır

# Backend dosyası değiştirdin (örn: services/executor/server.ts)
.\tools\windows\checkpoint.ps1 -Message "fix executor bug"
# → Normal checkpoint, VerifyUi yok
```

Bu sistem, UI'ı "yangın" olmaktan tamamen çıkarır ve otomatik refleks seviyesine indirir.

---

## Hızlı Referans

### Checkpoint Komutları

```powershell
# Mikro checkpoint (UI-touch otomatik tespit edilir)
.\tools\windows\checkpoint.ps1 -Message "UI: description"
# Not: UI dokunuşu varsa otomatik -VerifyUi eklenir

# Manuel VerifyUi (override)
.\tools\windows\checkpoint.ps1 -Message "description" -VerifyUi

# Tag push'u skip et (varsayılan: push eder)
.\tools\windows\checkpoint.ps1 -Message "description" -NoPushTags

# Günlük checkpoint
.\tools\windows\checkpoint.ps1 -Message "EOD" -Daily

# Golden master oluştur
.\tools\windows\golden-master.ps1 -Version "v1" -VerifyUi

# Stable worktree oluştur
.\tools\windows\stable-worktree.ps1
```

### Rollback Komutları

```powershell
# Son checkpoint'e dön
.\tools\windows\rollback.ps1

# Belirli tag'e dön
.\tools\windows\rollback.ps1 -Tag "cp/2026-01-13_17-39-00"

# Golden master'a dön
.\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"

# Sert reset (dikkat: uncommitted gider)
git reset --hard cp/2026-01-13_17-39-00
git clean -fd
```

### Golden Master Komutları

```powershell
# Golden master oluştur (UI doğru haldeyken)
.\tools\windows\golden-master.ps1 -Version "v1" -VerifyUi

# UI doğrulama olmadan (hızlı)
.\tools\windows\golden-master.ps1 -Version "v1"

# Tag push'u skip et
.\tools\windows\golden-master.ps1 -Version "v1" -NoPushTags
```

### Stable Worktree Komutları

```powershell
# Son golden master'dan stable worktree oluştur
.\tools\windows\stable-worktree.ps1

# Belirli golden master tag'inden oluştur
.\tools\windows\stable-worktree.ps1 -Tag "ui/golden-master/v1"

# Stable worktree'i sil
.\tools\windows\stable-worktree.ps1 -Remove

# Worktree listesi (manuel)
git worktree list
```

### Tag Listesi

```powershell
# Checkpoint tag'leri
git tag --list "cp/*" --sort=-creatordate

# Daily tag'leri
git tag --list "daily/*" --sort=-creatordate

# Golden master tag'leri
git tag --list "ui/golden-master/*" --sort=-creatordate
```
