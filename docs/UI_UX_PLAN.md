# UI/UX Planı ve Talimatları — Spark Trading Platform

> docs ping: trigger docs-lint 2025-10-28

**Amaç:** NN/g kullanılabilirlik prensipleri ve WCAG 2.2 (AA) uyumuyla; erişilebilir, tutarlı, performanslı bir arayüz standardı tanımlamak ve proaktif kabul kriterleriyle doğrulamak.

## 1) Stratejik Hedefler
- **Sistem Durumu Görünürlüğü:** Skeleton/loading ve boş durum (empty state) şablonları her kritik sayfada.
- **Erişilebilirlik (AA):** Kontrast ≥ 4.5:1, tüm eylemler klavyeyle erişilebilir, anlamlı `aria-*` etiketleri.
- **Tutarlı Terminoloji:** TR odaklı etiketler; menüler, başlıklar ve butonlar tek dilde.
- **Form Kalitesi:** Inline doğrulama, alan altı hata mesajı, submit sırasında `disabled+spinner`.
- **Navigasyon Netliği:** Aktif menü vurgusu + (gerektiğinde) breadcrumb.

## 2) Sayfa Bazlı İş Listesi (çekirdek)
**🏠 Ana Sayfa**
- [ ] Ticker/strateji panellerinde skeleton states
- [ ] Üst çubukta WS bağlantı durumu
- [ ] Menüde aktif sayfa highlight

**🧪 Strategy Lab**
- [ ] Kaydet/Backtest işlemlerine spinner + toast
- [ ] Monaco hataları için inline açıklama (satır/kolon)
- [ ] Kısayollar: `Ctrl+Enter` backtest, `Ctrl+Shift+O` optimize

**📋 Stratejilerim**
- [ ] Sonsuz kaydırma veya sayfalama
- [ ] Sil/Düzenle için onay modal (ikili seçim)

**🏃‍♂️ Çalışan Stratejiler**
- [ ] Sparkline boyutu + tooltip
- [ ] Pause/Resume ikon+metin; durum rozeti (running/paused/error)

**💼 Portföy**
- [ ] Fixlenmiş header + zebra tablo
- [ ] Canlı güncellenen satırlara yumuşak vurgu animasyonu

**⚙️ Ayarlar**
- [ ] Label + `aria-describedby` bağları
- [ ] Tema/dil seçimi TAB ile gezilebilir
- [ ] Kaydet altında işlem spinner'ı

> Planlanan sayfalar: **Alerts**, **Market Analysis**, **Risk Dashboard** — boş durum metinleri, net CTA'lar, grafiklerde eksen başlıkları ve birimler zorunlu.

## 3) Bileşen Kuralları
**Butonlar**: Birincil/ikincil ayrımı, net odak halkası, anlamlı `aria-label`.
**Formlar**: Zorunlu alan * işareti, gerçek zamanlı validasyon, submit'te `disabled`.
**Tablolar/Grafikler**: `thead>th[scope]`, zebra; grafiklerde başlık + eksen etiketleri + birim.

## 4) Test & Kabul Kriterleri (AA + Heuristics)
- **Kontrast (AA):** Tüm metinler ≥ 4.5:1.
- **Klavye Erişimi:** Tüm etkileşimler TAB ile erişilebilir; odak sırası mantıklı.
- **Form Hataları:** 5/5 senaryo alan altı mesajla yakalanır; "genel" toast tek başına yeterli değildir.
- **Skeleton/Boş Durum:** Dashboard, Strategy Lab, Portföy'de en az 1 örnek.
- **Yükleme P95:** < 3s içinde iskelet görünür; kritik CTA'lar FCP < 2s hedeflenir.

## 5) Ölçülebilir Başarı Metrikleri
- **SUS/CSAT ≥ 80/100**, **Görev Tamamlama ≥ %95** (Lab→Backtest→Run ilk deneme).
- **A11y Otomasyon:** Axe/Playwright denetimleri CI'da PASS (0 kritik ihlal).
- **Hata Oranı (Form):** Yanlış gönderimler %50 → %10.

## 6) Uygulama ve Doğrulama
- **A11y/Vis Testleri:** Playwright + Axe; `npm run test:e2e:a11y` (CI job).
- **Lighthouse CI:** 5 sayfada PWA değil; erişilebilirlik ve performans kartları izlenir.
- **Evidence:** `evidence/ui-ux/<YYYYMMDD>/` klasöründe rapor, screenshot, axe çıktıları.

## 7) Kaynaklar
- NN/g Heuristics, WCAG 2.2 Quickref, Data Viz Best Practices.

---
**Not:** Bu plan; mevcut tasarım sistemini koruyup tutarlılığı artırırken, canlı veri senaryolarında (WS staleness vb.) kullanıcıya kesintisiz geri bildirim sağlamayı hedefler.
