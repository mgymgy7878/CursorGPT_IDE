# UI & UX Planı — Spark Trading Platform (Golden Master + WCAG + Heuristics)

Bu plan; mevcut "UI/UX İyileştirme" dokümanındaki hedefleri ve sayfa bazlı iş listesini birleştirir, ayrıca yapılan UX heuristics/erişilebilirlik analizindeki bulguları backlog'a çevirir.

---

## 0) Amaç

1. Kullanıcı deneyimini NN/g heuristics prensipleriyle hizalamak
2. WCAG 2.2 AA seviyesine yaklaşmak (kontrast, klavye erişimi, aria)
3. Veri görselleştirmeyi "trader aklına" uygun, net ve düşük sürtünmeli hale getirmek
4. Golden Master (Figma) parity'yi "ölçülebilir checklist"e dönüştürmek

---

## 1) Ürün Seviyesi UX İlkeleri (Kısa)

- **Sistem durumu her zaman görünür olmalı** (loading, bağlantı, hata, canary)
- **Kullanıcı kontrolü:** kritik eylemlerde geri alma / onay / iptal
- **Tutarlılık:** TR terminoloji + tek design token seti
- **Erişilebilirlik:** klavye ile tam gezinim + focus ring + aria-label
- **Performans algısı:** skeleton/loading + küçük gecikmeleri maskele

---

## 2) Golden Master Parity Kuralları (Figma Referans)

### 2.1 Rails Davranışı (P0 — Kritik)

#### Sol Sidebar
- ✅ Collapsed/expanded tutarlı
- ✅ Aktif sayfa vurgusu net
- ✅ Icon-only mode + accent colors

#### Sağ Rail (Copilot)
- **P0:** Panel kapalıyken bile sağ kenarda **icon dock** görünür olmalı
  - Dock: en az 3–5 ikon (Copilot, Shield/Risk, Alerts, Metrics vb.) + tooltip
  - Panel açılınca dock sabit kalır, panel dock'un soluna genişler
- ✅ SparkAvatar + subtitle + Model pill
- ✅ Soft dividers (border-white/10)

### 2.2 MarketData Etkileşimi (P0 — Kritik)

- **P0:** Seçili enstrüman için sayfa içinde bir **"Chart Preview"** alanı (mini/embedded) göster
- **P0:** Enstrümana tıklayınca grafik açılır (seçili sembol değişir, chart güncellenir)
- ✅ "Tam Ekran" ayrı mod olarak çalışır (query param ile)
- ✅ Mini Grafik (sparkline) kolonu
- ✅ RSI / Signal kolonları

---

## 3) Bileşen Kuralları

### Butonlar
- Primary/Secondary ayrımı net
- Focus ring görünür
- İkon-only butonlarda aria-label zorunlu

### Formlar
- Label + aria-describedby zorunlu
- Inline validasyon (alan bazlı)
- Submit sırasında disabled + spinner

### Tablo & Grafik
- Tablolar: thead + th[scope] + zebra pattern
- Grafik: başlık + eksen etiketleri + birimler + tooltip (birim dahil)

---

## 4) Sayfa Bazlı Backlog (D1–D3 sonrası)

**Öncelik:** P0 (kritik), P1 (önemli), P2 (iyileştirme)

### Ana Sayfa / Dashboard
| Öncelik | İş |
|---------|-----|
| P0 | Skeleton loading (ticker/strateji panelleri) |
| P1 | Menüde aktif sayfa işaretleme + breadcrumb (opsiyon) |
| P1 | WS bağlantı durumu üst çubukta görünür |

### MarketData
| Öncelik | İş |
|---------|-----|
| **P0** | Seçili enstrüman chart preview (embedded) |
| **P0** | Row click → chart aç (sembol seçimi) |
| P1 | Sinyal rozetlerinin açıklaması (tooltip) |
| P1 | Filtre + arama erişilebilirliği (klavye, aria) |

### Strategy Lab
| Öncelik | İş |
|---------|-----|
| P0 | Run/Backtest işlemlerinde spinner + başarı/toast |
| P0 | Kod hataları için inline açıklama |
| P1 | Son loglar & status paneli |
| P1 | Kısayollar (Ctrl+Enter backtest, Ctrl+Shift+O optimize) |

### Stratejilerim
| Öncelik | İş |
|---------|-----|
| P1 | Sayfalama / sonsuz kaydırma |
| P0 | Silme/düzenleme onay modalı |

### Çalışan Stratejiler
| Öncelik | İş |
|---------|-----|
| P1 | Sparkline büyüt + tooltip |
| P1 | Pause/Resume ikon+metin |
| P0 | Durum rozeti (running/paused/error) |

### Portföy
| Öncelik | İş |
|---------|-----|
| P1 | Tablo header fix + zebra |
| P1 | Kolon sıralama ikonları |
| P2 | Periyodik güncellenen satırda animasyon vurgusu |

### Ayarlar
| Öncelik | İş |
|---------|-----|
| P0 | Label + aria-describedby |
| P1 | Tema/dil seçiminde TAB ile gezilebilirlik |
| P1 | Kaydet butonunda spinner |

### Alerts (Planlanan)
| Öncelik | İş |
|---------|-----|
| P1 | Boş durum + CTA |
| P0 | Yeni alarm formunda doğrulama + onay |

### Market Analysis (Planlanan)
| Öncelik | İş |
|---------|-----|
| P1 | Grid düzeni optimize |
| P0 | Grafiklerde başlık/açıklama/eksen etiketleri zorunlu |

---

## 5) Test ve Kabul Kriterleri

| Kriter | Hedef |
|--------|-------|
| WCAG AA kontrast | ≥ 4.5:1 |
| Klavye erişimi | Tüm interaktif öğelere TAB ile erişim |
| Form validasyonları | 5/5 hatalı senaryonun yakalanması |
| Yükleme süresi (algı) | P95 < 3s, skeleton gösterimi |
| Golden Master parity | Rails + MarketData etkileşimi PASS |

---

## 6) Uygulama Notları (Yakın Sprint)

UI parity değişiklikleri küçük PR'lara bölünmeli:

### PR-1: RightRail Icon Dock
- Panel kapalıyken sağ kenarda icon dock görünür
- Ikonlar: Copilot, Risk/Shield, Alerts, Metrics
- Tooltip on hover
- Click → panel açılır

### PR-2: MarketData Embedded Chart
- Sayfa üstünde chart preview alanı
- Row click → selectedSymbol state güncelle
- Chart component (TechnicalOverview) embedded render
- "Tam Ekran" modu query param ile ayrı

### PR-3: Skeleton & Form Validation
- Dashboard kartlarına skeleton loading
- Settings/StrategyLab form validation
- Spinner on submit

---

## KAYNAK NOTU

Bu dosya, UI/UX iyileştirme talimatları ve sayfa bazlı iş listesini temel alır; ayrıca UX heuristics/erişilebilirlik bulgularını backlog'a dönüştürür.
