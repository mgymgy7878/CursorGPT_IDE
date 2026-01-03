# UI Copy Style Guide

**Tarih:** 2025-12-28
**Versiyon:** 1.0
**Hedef:** Spark Trading Platform için tutarlı, profesyonel UI metin standardı

---

## 1. Fiil Seti (Action Verbs)

**Standart fiiller (tekil kararlar):**

| Fiil | Kullanım | Örnek |
|------|----------|-------|
| **Oluştur** | Yeni bir şey oluşturma | "Strateji Oluştur", "Uyarı Oluştur" |
| **Analiz et** | Veri/grafik analizi | "Grafiği analiz et", "Portföy riskini analiz et" |
| **Özetle** | Bilgi özetleme | "Çalışan stratejileri özetle" |
| **İncele** | Detaylı inceleme | "Detayları incele", "Logları incele" |
| **Test et** | Bağlantı/test işlemleri | "Test Et", "Bağlantıyı test et" |
| **Kaydet** | Veri kaydetme | "Kaydet", "Ayarları kaydet" |
| **Çık** | Sayfa/ekrandan çıkma | "Çık", "Tam Ekran'dan çık" |
| **Dön** | Geri dönüş navigasyonu | "Listeye Dön", "Tabloya Dön" |

**Yasak fiiller (tutarsızlık yaratır):**
- ❌ "Üret" (yerine: "Oluştur")
- ❌ "Çıkar" (yerine: "Analiz et" veya "Özetle")
- ❌ "Kur" (yerine: "Oluştur" veya "Ayarla")
- ❌ "Çıkış" (yerine: "Çık")

---

## 2. Noun/Terim Standartları

### 2.1. Tablo Kolon Başlıkları

| Terim | Standart Yazım | Kısaltma | Örnek |
|-------|----------------|----------|-------|
| Strateji | Strateji | - | Tablo kolonu |
| Piyasa | Piyasa | - | Tablo kolonu |
| Mod | Mod | - | Tablo kolonu (live/shadow) |
| Açık Pozisyon | Açık Poz. | Açık Poz. | Tablo kolonu |
| Maruziyet | Maruziyet | - | Tablo kolonu |
| PnL 24h | PnL 24h | 24h | Tablo kolonu |
| PnL 7d | PnL 7d | 7d | Tablo kolonu |
| Risk | Risk | - | Tablo kolonu |
| Sağlık | Sağlık | - | Tablo kolonu |
| Durum | Durum | - | Tablo kolonu |
| İşlemler | İşlemler | - | Tablo kolonu (Actions) |

### 2.2. Risk ve Durum Terimleri

| Terim | Standart Yazım | Kullanım |
|-------|----------------|----------|
| Risk Seviyesi | Düşük / Orta / Yüksek | Risk badge'leri |
| Durum | Aktif / Duraklatıldı / Durduruldu | Strateji durumu |
| Sağlık | OK / Degraded / Down | Sistem sağlığı |
| Risk Modu | Shadow / Live | Copilot context |

### 2.3. Metrik Terimleri

| Terim | Standart Yazım | Kısaltma | Örnek |
|-------|----------------|----------|-------|
| Günlük Zarar | Günlük Zarar | - | Risk kartı |
| Açık Emirler | Açık Emirler | - | Risk kartı |
| Mevcut Maruziyet | Mevcut Maruziyet | - | Risk kartı |
| Max Drawdown | Max DD | Max DD | Risk kartı |
| Maximum Drawdown | Max DD | Max DD | Tablo kolonu |

---

## 3. Sinyal Rozetleri (Market Data)

| Sinyal | Standart Yazım | Renk |
|--------|----------------|------|
| BUY | AL | Yeşil (emerald) |
| STRONG BUY | GÜÇLÜ AL | Yeşil (emerald, daha koyu) |
| HOLD | BEKLE | Turuncu (amber) |
| SELL | SAT | Kırmızı (red) |

---

## 4. Navigasyon Terimleri

| Aksiyon | Standart Yazım | Kullanım |
|---------|----------------|----------|
| Listeye dönüş | Listeye Dön | Market Data workspace → list |
| Tabloya dönüş | Tabloya Dön | Chart → table (eski, kullanılmayacak) |
| Tam ekran | Tam Ekran | Chart fullscreen modu |
| Çıkış | Çık | Fullscreen'den çıkış |

**Kural:** "Tabloya Dön" yerine "Listeye Dön" kullanılacak (tutarlılık için).

---

## 5. Copilot Context Chip Etiketleri

| Etiket | Standart Yazım | Değer Örnekleri |
|--------|----------------|-----------------|
| Sistem | Sistem | Normal / Degraded / Down |
| Strateji | Strateji | BTCUSDT / — |
| Mod | Mod | Shadow / Live |

---

## 6. Teknik Terimler (Korunur)

**Bu terimler İngilizce kalacak (uluslararası standart):**

- PnL (Profit and Loss)
- RSI (Relative Strength Index)
- SL (Stop Loss)
- TP (Take Profit)
- Leverage
- Sharpe (Sharpe Ratio)
- Drawdown
- Max DD (Maximum Drawdown)
- API (Application Programming Interface)
- WS (WebSocket)
- FIX (Financial Information eXchange)
- OAuth

---

## 7. Büyük/Küçük Harf Kuralları

### 7.1. Buton Metinleri
- **İlk harf büyük:** "Oluştur", "Kaydet", "Test Et"
- **Tamamı büyük:** Sadece özel durumlarda (örn. "ACİL DURDUR")

### 7.2. Tablo Kolon Başlıkları
- **İlk harf büyük:** "Strateji", "Piyasa", "Risk"
- **Kısaltmalar:** "PnL 24h", "Max DD", "Açık Poz."

### 7.3. Badge/Rozet Metinleri
- **Tamamı büyük:** "AL", "GÜÇLÜ AL", "BEKLE", "SAT"
- **İlk harf büyük:** "Düşük", "Orta", "Yüksek", "Aktif", "Duraklatıldı"

---

## 8. Noktalama Kuralları

- **Nokta (.) kullanımı:**
  - Kısaltmalarda: "Açık Poz.", "Max DD"
  - Cümle sonlarında: Yok (buton/label metinleri kısa)
- **İki nokta üst üste (:):**
  - Label:value formatında: "Sistem: Normal", "Risk: Orta"
- **Tire (-):**
  - Sadece teknik terimlerde: "PnL 24h", "Max DD"

---

## 9. Kısaltmalar

| Tam Terim | Kısaltma | Kullanım |
|-----------|----------|----------|
| 24 saat | 24h | "PnL 24h" |
| 7 gün | 7d | "PnL 7d" |
| Açık Pozisyon | Açık Poz. | Tablo kolonu |
| Maximum Drawdown | Max DD | Risk kartı / tablo |
| Application Programming Interface | API | Teknik terim (korunur) |
| WebSocket | WS | Teknik terim (korunur) |

---

## 10. Kullanım Örnekleri

### ✅ Doğru Kullanımlar:
- "Strateji Oluştur" (StatusBar dropdown)
- "Listeye Dön" (Market Data workspace)
- "Tam Ekran" (Chart view)
- "Çık" (Fullscreen'den çıkış)
- "PnL 24h" (Tablo kolonu)
- "Max DD" (Risk kartı)
- "AL" / "GÜÇLÜ AL" / "BEKLE" / "SAT" (Sinyal rozetleri)
- "Düşük" / "Orta" / "Yüksek" (Risk seviyeleri)

### ❌ Yanlış Kullanımlar:
- "Strateji Üret" (yerine: "Oluştur")
- "Tabloya Dön" (yerine: "Listeye Dön")
- "Çıkış" (yerine: "Çık")
- "24 saat PnL" (yerine: "PnL 24h")
- "Maximum Drawdown" (yerine: "Max DD")
- "Buy" / "Strong Buy" (yerine: "AL" / "GÜÇLÜ AL")

---

## 11. Copy Audit Checklist

**Yasaklı string'ler (artık uiCopy.ts'den gelmeli):**
- "Strateji Oluştur" → `uiCopy.create.strategy`
- "Uyarı Oluştur" → `uiCopy.create.alert`
- "Tabloya Dön" → `uiCopy.nav.backToList`
- "Listeye Dön" → `uiCopy.nav.backToList`
- "Tam Ekran" → `uiCopy.nav.fullscreen`
- "Çık" → `uiCopy.nav.exit`
- "AL" / "GÜÇLÜ AL" / "BEKLE" / "SAT" → `uiCopy.signals.*`
- "Düşük" / "Orta" / "Yüksek" → `uiCopy.risk.*`

---

## 12. Migration Stratejisi

1. **İlk Dalga (PATCH V):**
   - StatusBar: "+ Oluştur" menüsü
   - Copilot: Context chip etiketleri
   - Market Data: Sinyal rozetleri + navigasyon
   - Running/Strategies: Tablo kolon başlıkları
   - Risk: Risk seviyesi etiketleri

2. **İkinci Dalga (gelecek):**
   - Form label'ları
   - Toast mesajları
   - Error mesajları
   - Tooltip metinleri

---

## 13. Copy Audit Script

`tools/copy-audit.mjs` script'i ile yasaklı string'leri tespit eder:
- Hardcoded "Strateji Oluştur", "Uyarı Oluştur" vb.
- uiCopy.ts kullanılmayan yerler

**Kullanım:**
```bash
node tools/copy-audit.mjs
```

---

**Son Güncelleme:** 2025-12-28
**Sorumlu:** UI/UX Team
**Review:** Her major release'de gözden geçirilir

