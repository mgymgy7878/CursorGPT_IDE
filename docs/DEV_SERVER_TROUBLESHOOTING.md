# Dev Server Troubleshooting

**Tarih:** 2025-01-15
**Durum:** ✅ Aktif

---

## 🚀 Hızlı Checklist (En Kısa Yol)

### 1️⃣ Dev Server'ı Başlat

Yeni bir terminal aç (Cursor / VSCode / PowerShell):

```bash
cd <spark-monorepo-kök>   # monorepo'nun root'u
pnpm dev --filter web-next
```

### 2️⃣ Terminal Çıktısını Kontrol Et

Terminalde şu satırı ara:

```
▲ Next.js ...
- Local: http://localhost:XXXX
```

**Port eşleştirmesi:**

- `Local: http://localhost:3003` → Tarayıcı: `http://localhost:3003/strategy-studio`
- `Local: http://localhost:3004` → Tarayıcı: `http://localhost:3004/strategy-studio`
- `Local: http://localhost:3000` → Tarayıcı: `http://localhost:3000/strategy-studio`

**Altın Kural:** Tarayıcıdaki port = Terminalde "Local:" satırındaki port

### 3️⃣ Dev Server Çalışıyor mu?

Terminalde şu ikisini mutlaka görmen lazım:

- ✅ `Local: http://localhost:XXXX` satırı
- ✅ `Ready in ...` satırı

**Bunlar yoksa:**

- Next.js dev server ya hiç başlamıyor ya da anında crash oluyor
- Terminalde kırmızı hata satırı vardır → Hata mesajını kontrol et

### 4️⃣ Port Kontrolü (Opsiyonel)

PowerShell'de:

```powershell
# 3003 kontrolü
netstat -ano | findstr :3003

# 3004 kontrolü
netstat -ano | findstr :3004
```

**Çıktı:**

- Hiç satır yok → Port boş, server kapalı
- Satır varsa → PID görürsün, server çalışıyor (port eşleşmesi hatalı olabilir)

---

## 🔴 ERR_CONNECTION_REFUSED Hatası

**Belirti:** Tarayıcıda `ERR_CONNECTION_REFUSED` hatası alıyorsun
**Kök Sebep:** Dev server çalışmıyor veya farklı portta çalışıyor

**Çözüm:** Yukarıdaki "Hızlı Checklist" adımlarını takip et.

---

## Adım Adım Çözüm

### 1️⃣ Dev Server'ı Başlat

Yeni bir terminal aç (PowerShell / Git Bash fark etmez):

```bash
cd <spark-monorepo-kök>
pnpm dev --filter web-next
```

**Beklenen çıktı:**

```
▲ Next.js 14.2.13
- Local:        http://localhost:3003
  Ready in X.Xs
```

### 2️⃣ Terminal Çıktısını Kontrol Et

**Olası durumlar:**

#### ✅ Normal Durum

```
▲ Next.js 14.2.13
- Local:        http://localhost:3003
  Ready in X.Xs
```

→ Tarayıcıda `http://localhost:3003/strategy-studio` aç

#### ⚠️ Port Değişmiş

```
▲ Next.js 14.2.13
- Local:        http://localhost:3004
  Ready in X.Xs
```

→ Port 3003 kullanılıyor, Next 3004'e geçmiş
→ Tarayıcıda `http://localhost:3004/strategy-studio` aç

#### ⚠️ Port 3000'e Dönmüş

```
▲ Next.js 14.2.13
- Local:        http://localhost:3000
  Ready in X.Xs
```

→ Tarayıcıda `http://localhost:3000/strategy-studio` aç

#### ❌ Hata Var

```
Error: ...
```

→ Terminaldeki hata mesajını kontrol et
→ Build hatası olabilir, hata mesajını düzelt

#### ❌ "Local: ..." Satırı Yok

→ Process crash olmuş olabilir
→ Terminaldeki tüm çıktıyı kontrol et

### 3️⃣ Port Kontrolü (Opsiyonel)

PowerShell'de port kontrolü:

```powershell
# 3003 portunda dinleyen process var mı?
netstat -ano | findstr :3003
```

**Çıktı:**

- Hiç satır yok → Port boş, dev server çalışmıyor
- Satır varsa → PID numarasını görürsün (process çalışıyor)

**PID kontrolü:**

```powershell
# PID numarasını öğrendikten sonra
tasklist | findstr <PID>
```

### 4️⃣ Hızlı Sanity Check Akışı

1. **Terminalde:** `pnpm dev --filter web-next` başlat
2. **Terminalde:** Gerçek portu oku (`Local: http://localhost:XXXX`)
3. **Browser'da:** Aynı port ile aç: `http://localhost:XXXX/strategy-studio`

**Hâlâ connection refused alıyorsan:**

- Dev server anında crash oluyor (terminalde hata görürsün)
- Farklı bir workspace'te / yanlış klasörde komut çalıştırıyorsun

---

## Önemli Notlar

### Port Eşleşmesi

**Altın Kural:** Tarayıcının portu = Terminalde yazan port

- Terminal: `Local: http://localhost:3003` → Browser: `http://localhost:3003/...`
- Terminal: `Local: http://localhost:3004` → Browser: `http://localhost:3004/...`
- Terminal: `Local: http://localhost:3000` → Browser: `http://localhost:3000/...`

### Figma Link Güncellemesi

Figma'daki local link'ler terminalde yazan port ile eşleşmeli:

- Terminal: `3003` → Figma: `http://localhost:3003/strategy-studio`
- Terminal: `3004` → Figma: `http://localhost:3004/strategy-studio`
- Terminal: `3000` → Figma: `http://localhost:3000/strategy-studio`

---

## Yaygın Hatalar

### "Port 3003 is in use, use 3004 instead?"

**Sebep:** 3003 portu başka bir process tarafından kullanılıyor

**Çözüm:**

- `y` dediysen → Next artık 3004'te çalışıyor
- Tarayıcıda `http://localhost:3004/strategy-studio` aç
- Figma link'ini de `3004` portuna güncelle

### Build Hatası

**Belirti:** Terminalde kırmızı hata mesajları

**Çözüm:**

- Hata mesajını oku
- TypeScript hatası mı? → `pnpm typecheck` çalıştır
- Lint hatası mı? → `pnpm lint` çalıştır
- Dependency hatası mı? → `pnpm install` çalıştır

### Process Anında Crash

**Belirti:** "Local: ..." satırı hiç gelmiyor, process hemen bitiyor

**Çözüm:**

- Terminaldeki tüm çıktıyı kontrol et
- Hata mesajını bul ve düzelt
- Gerekirse `.next` klasörünü sil ve tekrar dene: `pnpm clean && pnpm dev --filter web-next`

---

## Checklist

- [ ] Terminal açıldı
- [ ] `pnpm dev --filter web-next` çalıştırıldı
- [ ] Terminalde "Local: http://localhost:XXXX" satırı görünüyor
- [ ] Tarayıcıda aynı port kullanılıyor (`http://localhost:XXXX/strategy-studio`)
- [ ] Figma link'i terminaldeki port ile eşleşiyor
- [ ] Sayfa açılıyor (connection refused yok)

**Tüm maddeler ✅ ise, dev server düzgün çalışıyor demektir.**

---

## İlgili Dosyalar

- `docs/LOCAL_DEV_SETUP.md` - Dev server setup
- `apps/web-next/package.json` - Dev script config
- `apps/web-next/next.config.mjs` - Next.js config
