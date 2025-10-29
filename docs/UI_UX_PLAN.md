# Spark Trading Platform — UI/UX Planı (D1–D3 Sonrası)

**Amaç:** Spark arayüzünde erişilebilirlik, kullanılabilirlik ve veri görselleştirme standartlarını NN/g (10 Heuristic) ve WCAG 2.2 AA ile hizalamak; sayfa-bazlı checklist ve kabul kriterleri ile ölçülebilir kalite sağlamak.

## 1) Standartlar ve İlkeler

- NN/g 10 Heuristic: sistem durumu görünürlüğü, kullanıcı kontrolü, tutarlılık, hata önleme, minimalist tasarım.
- WCAG 2.2 (AA) odak: Kontrast ≥4.5:1, klavye ile tam kullanım (SC 2.1.1), odak görünür, anlamlı etiketler/role/aria-\*.
- Klavye-yalnız akış: TAB sırası, kaçış (Esc), modal/dialog tuzak yok, scrollable bölgeler odaklanabilir.
- Veri görselleştirme: her grafikte **başlık + eksen etiketleri + birim + tooltip**; dashboard'larda 2–3 ana görünüm kuralı.

## 2) Sayfa Bazlı İş Listesi

**🏠 Dashboard**

- [ ] Ticker/strateji panellerinde skeleton.
- [ ] Sol menüde **aktif sayfa vurgusu**.
- [ ] Üst çubukta **WS durumu** (green/yellow/red).
      **🧪 Strategy Lab**
- [ ] **Kaydet/Backtest** sırasında spinner + başarı/hatada toast.
- [ ] Editor hatalarında **inline açıklama**.
- [ ] Kısayollar: `Ctrl+Enter` backtest, `Ctrl+Shift+O` optimize.
      **📋 Stratejiler**
- [ ] Sayfalama/sonsuz kaydırma.
- [ ] Sil/Düzenle için onay diyalogu.
      **🏃‍♂️ Çalışan Stratejiler**
- [ ] Sparkline boyutu ↑, tooltip ve birim.
- [ ] Pause/Resume **ikon+metin**, **durum rozeti** (running/paused/error).
      **💼 Portföy**
- [ ] Sticky thead, zebra tablo, kolon sıralama ikonları.
- [ ] Periyodik güncellenen satırlarda kısa "pulse" animasyonu.
      **⚙️ Ayarlar**
- [ ] Her input için `label` + `aria-describedby`.
- [ ] Tema/dil seçimi **TAB ile** gezilebilir.
- [ ] Kaydet'te disabled + spinner.
      **🔔 Alerts (Planlanan)**
- [ ] "Henüz alarm yok" boş durum + CTA.
- [ ] Form validasyonu + onay diyalogu.
      **📊 Market Analysis (Planlanan)**
- [ ] Grid düzeni sadeleştirme.
- [ ] Grafiklerde **başlık, eksen, birim zorunlu**; tooltip'te renkli değer + birim.

## 3) Bileşen Kuralları

**Butonlar**

- Birincil/ikincil hiyerarşi; net odak halkası; `aria-label` zorunlu (ikon-yalnız).
  **Formlar**
- Zorunlu alan işareti; **inline** validasyon; submit'te disabled + spinner; `for/id` bağları.
  **Tablo & Grafik**
- `thead > th[scope]`, zebra pattern, sıralama ikonları.
- Grafikte **başlık/eksensel etiket/birim/legend**; `aria-label` tanımı.

## 4) Test & Kabul Kriterleri (Definition of Done)

- **WCAG AA Kontrast:** tüm metin ≥4.5:1.
- **Klavye-yalnız:** kritik akışlar (Dashboard, Strategy Run, Settings) tamamen klavye ile tamamlanır.
- **Form Hataları:** 5/5 olumsuz senaryoda alan altında anlamlı mesaj.
- **Skeleton & Yükleme:** P95 <3s, iskelet ekran görünüyor.
- **Boş Durumlar:** her ana sayfada en az 1 boş durum mesajı + CTA.
- **Lighthouse A11y ≥90**, Axe kritik/serious 0.

## 5) Uygulama Notları

- `dark`/`light` için `color-scheme` ayarı; odak görünürlüğü token'larla (örn. `outline-ring`).
- Klavye test turları: `TAB`, `Shift+TAB`, `Enter`, `Space`, `Esc`; scrollable bölgeler `tabindex="0"` ile odaklanabilir.
- Dashboard'da en fazla **2–3 ana görünüm**; fazlası yeni panele ayrılır.

## 6) İzleme ve Araçlar

- **Axe** (Playwright/CLI) ile erişilebilirlik taraması.
- **Lighthouse**: A11y + Performance raporu.
- "UI-A11Y" GitHub Action (isteğe bağlı) ile PR'da otomatik skor.

---

**Ek:** Bu plan, kurum içi "Ui Ux Improvements Spark.pdf" ve "arayüz detaylı araştırma.txt" bulgularının sadeleştirilmiş uygulama talimatıdır.
