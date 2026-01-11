# UI Tekrar Audit Raporu

**Tarih:** 2025-12-28
**Kapsam:** Dashboard, Market Data, Strategies, Running, Control, Settings

## 1. Üst Bar CTA Tekrarları

### Tespit Edilenler:
- **"Strateji Oluştur"** + **"Uyarı Oluştur"** butonları her sayfada görünüyor
  - Dosya: `apps/web-next/src/components/status-bar.tsx` (satır 241-250)
  - Kullanım: Dashboard, Market Data, Strategies, Running, Control, Settings (tüm sayfalar)

### Öneri:
- Tek bir **"+ Oluştur"** dropdown menüsüne çevir
- Dropdown içeriği: "Strateji Oluştur" / "Uyarı Oluştur"

---

## 2. Copilot Greeting Tekrarı

### Tespit Edilenler:
- **"Merhaba, ben Spark Copilot..."** mesajı her route'ta aynı
  - Dosya: `apps/web-next/src/components/copilot/CopilotDock.tsx` (satır 45)
  - Dosya: `apps/web-next/src/components/layout/AppFrame.tsx` (satır 560)
  - Kullanım: Dashboard, Market Data, Strategies, Running, Control (tüm sayfalar)

### Öneri:
- Copilot greeting'i global store'da tut (localStorage persist)
- Route değişince aynı greeting'i tekrar basma
- İlk açılışta 1 kez göster

---

## 3. Copilot Durum Satırı Tekrarı

### Tespit Edilenler:
- **"Sistem: Normal - Strateji: — - Risk modu: Shadow"** satırı her sayfada
  - Dosya: `apps/web-next/src/components/copilot/CopilotDock.tsx` (satır 285-296)
  - Kullanım: Tüm sayfalar

### Öneri:
- Tek satır metin yerine 3 küçük chip yap:
  - `Sistem: Normal`
  - `Strateji: BTCUSDT / —`
  - `Mod: Shadow`

---

## 4. Market Data Quick Actions Tekrarı

### Tespit Edilenler:
- Copilot'ta route'a göre farklı quick-action'lar var:
  - Market Data: "Bu grafiği analiz et" / "Kritik seviyeler" / "Setup çıkar"
  - Control: "Uyarı üret" / "Drawdown analizi"
  - Dashboard: "Portföy riskini analiz et" / "Çalışan stratejileri özetle"

### Öneri:
- Quick-action set'ini route'a göre tek merkezden üret
- Metinleri standartlaştır:
  - "Bu grafiği analiz et" → "Grafiği analiz et"
  - "Setup çıkar" → "Setup üret" veya "Kurulum öner"

---

## 5. Tablo Filtre Chip Tekrarı

### Tespit Edilenler:
- Strategies: "Crypto" / "FX" / "Running" / "Paused"
- Running: "Live" / "Shadow" / "OK" / "Degraded"
- Aynı görsel dilde ama farklı ekranlarda ufak farklar var

### Öneri:
- Tek component: `SegmentedFilters`
- "Live/Shadow" ile "Running/Paused" gibi filtreleri aynı "chip grammar" içinde hizala

---

## 6. Form Buton Tekrarı

### Tespit Edilenler:
- Settings > Borsa API: Her kartta "Kaydet" + "Test Et"
  - Binance, BTCTurk, BIST broker formları
  - Aynı pattern tekrarlanıyor

### Öneri:
- Kart header'ında tek bir "…" menü + primary "Test Et"
- "Kaydet" otomatik (debounced autosave) olursa iki buton azalır

---

## Sonuç

**Toplam Tekrar Sayısı:** 6 kategori
**Etkilenen Sayfalar:** Tüm sayfalar (Dashboard, Market Data, Strategies, Running, Control, Settings)
**Öncelik:** Yüksek (UX tutarlılığı ve profesyonel görünüm için kritik)

