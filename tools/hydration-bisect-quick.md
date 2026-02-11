# Hydration Bisect - Hızlı Test Rehberi

## ⚡ 1 Dakikada Suçlu Subtree'yi Yakala

### Baseline Test (Bisect Kapalı)

```powershell
# Dev server'ı başlat (env YOK)
pnpm --filter web-next dev -- --port 3003
```

**Kontrol:**
- Browser: `http://127.0.0.1:3003/dashboard` aç
- Ctrl+Shift+R (hard reload)
- **Overlay VAR/YOK?** → Not et
- CTRL+C ile server'ı durdur

**Sonuç:** `baseline: overlay VAR/YOK`

---

### Gate Testleri (Her biri için ayrı ayrı)

#### Gate 1: topbar

```powershell
$env:NEXT_PUBLIC_HYDRATION_BISECT='1'; $env:NEXT_PUBLIC_HYDRATION_GATES='topbar'; pnpm --filter web-next dev -- --port 3003
```

**Kontrol:**
- Browser: `http://127.0.0.1:3003/dashboard` aç
- Ctrl+Shift+R (hard reload)
- **Sol üstte sarı badge göründü mü?** (BISECT ON · gates: topbar)
- **Overlay VAR/YOK?** → Not et
- CTRL+C ile server'ı durdur

**Sonuç:** `topbar: overlay VAR/YOK (badge: GÖRÜNDÜ/GÖRÜNMEDİ)`

---

#### Gate 2: sidebar

```powershell
$env:NEXT_PUBLIC_HYDRATION_BISECT='1'; $env:NEXT_PUBLIC_HYDRATION_GATES='sidebar'; pnpm --filter web-next dev -- --port 3003
```

**Kontrol:**
- Browser: `http://127.0.0.1:3003/dashboard` aç
- Ctrl+Shift+R (hard reload)
- **Sol üstte sarı badge göründü mü?** (BISECT ON · gates: sidebar)
- **Overlay VAR/YOK?** → Not et
- CTRL+C ile server'ı durdur

**Sonuç:** `sidebar: overlay VAR/YOK (badge: GÖRÜNDÜ/GÖRÜNMEDİ)`

---

#### Gate 3: main

```powershell
$env:NEXT_PUBLIC_HYDRATION_BISECT='1'; $env:NEXT_PUBLIC_HYDRATION_GATES='main'; pnpm --filter web-next dev -- --port 3003
```

**Kontrol:**
- Browser: `http://127.0.0.1:3003/dashboard` aç
- Ctrl+Shift+R (hard reload)
- **Sol üstte sarı badge göründü mü?** (BISECT ON · gates: main)
- **Overlay VAR/YOK?** → Not et
- CTRL+C ile server'ı durdur

**Sonuç:** `main: overlay VAR/YOK (badge: GÖRÜNDÜ/GÖRÜNMEDİ)`

---

#### Gate 4: copilot

```powershell
$env:NEXT_PUBLIC_HYDRATION_BISECT='1'; $env:NEXT_PUBLIC_HYDRATION_GATES='copilot'; pnpm --filter web-next dev -- --port 3003
```

**Kontrol:**
- Browser: `http://127.0.0.1:3003/dashboard` aç
- Ctrl+Shift+R (hard reload)
- **Sol üstte sarı badge göründü mü?** (BISECT ON · gates: copilot)
- **Overlay VAR/YOK?** → Not et
- CTRL+C ile server'ı durdur

**Sonuç:** `copilot: overlay VAR/YOK (badge: GÖRÜNDÜ/GÖRÜNMEDİ)`

---

## 📋 Sonuç Formatı (Kopyala-Yapıştır)

Test bittiğinde şu formatta paylaş:

```
baseline: overlay VAR/YOK
topbar: overlay VAR/YOK (badge: GÖRÜNDÜ/GÖRÜNMEDİ)
sidebar: overlay VAR/YOK (badge: GÖRÜNDÜ/GÖRÜNMEDİ)
main: overlay VAR/YOK (badge: GÖRÜNDÜ/GÖRÜNMEDİ)
copilot: overlay VAR/YOK (badge: GÖRÜNDÜ/GÖRÜNMEDİ)
```

---

## 🔍 Yorumlama

### Senaryo 1: Baseline'de overlay YOK
✅ **Hydration mismatch çözülmüş!**
- Sadece "1 error toast" kaldıysa → ErrorSink loglarını temizle
- Bisect'e gerek yok

### Senaryo 2: Bir gate overlay'i söndürüyor
✅ **Suçlu blok bulundu!**
- Örnek: `topbar: overlay YOK` → mismatch topbar'da
- **Sonraki adım:** O blok içinde 2. tur mini-bisect

### Senaryo 3: Hiçbiri söndürmüyor
⚠️ **Mismatch bu blokların dışında**
- Layout/html/body/theme hattında olabilir
- Çoklu blok etkileşimi olabilir
- Çiftli test: `GATES=topbar,main`

### Senaryo 4: Badge görünmüyor
❌ **Env/restart sorunu**
- `NEXT_PUBLIC_HYDRATION_BISECT=1` okunmamış
- Server restart edilmemiş
- Test geçersiz, tekrar dene

---

## 🎯 Sonraki Adım (Suçlu Blok Bulununca)

Örnek: `topbar` suçlu ise → topbar içinde mini-bisect:

```powershell
# StatusBar component'ini gate'le
$env:NEXT_PUBLIC_HYDRATION_GATES='topbar-statusbar'

# Latency göstergelerini gate'le
$env:NEXT_PUBLIC_HYDRATION_GATES='topbar-metrics'

# EB badge'i gate'le
$env:NEXT_PUBLIC_HYDRATION_GATES='topbar-eb'
```

Her mini-gate için overlay kontrolü yap → en küçük suçlu component'i bul.

