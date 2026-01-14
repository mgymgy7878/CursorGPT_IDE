# Spark Trading Platform — UI/UX Planı ve Uygulama Talimatları

**Amaç:** Spark'ın mevcut + planlanan sayfalarında erişilebilirlik (WCAG 2.2 AA), kullanılabilirlik (NN/g heuristics), veri görselleştirme ve operasyonel "durum görünürlüğü" standartlarını tek bir kaynakta toplamak.

**Kapsam:** Dashboard (Ana Sayfa), Piyasa Verileri, Strategy Lab, Stratejilerim, Çalışan Stratejiler, Portföy, Ayarlar, Alerts (plan), Market Analysis (plan), News (plan), sağ rail Copilot paneli.

---

## 1) Tasarım İlkeleri (Non-negotiables)

### 1.1 Sistem Durumu Görünürlüğü (NN/g)
- Her kritik akışta durum görünür olacak: **loading / empty / error / success / stale**.
- WS/Feed/Executor/Engine sağlık göstergeleri: üst bar + sayfa içi kartlarda tutarlı rozetler.
- "Belirsizlik yok": kullanıcı "şu an ne oluyor?" sorusuna 1 saniyede cevap bulmalı.

### 1.2 Erişilebilirlik (WCAG 2.2 AA)
- Kontrast: metin/arka plan **≥ 4.5:1** (AA).
- Klavye: tüm interaktif öğeler **TAB ile erişilebilir**, odak halkası net.
- Formlar: label + aria-describedby + inline hata mesajı.
- Tooltip/ikon-only butonlar: **aria-label zorunlu**.

### 1.3 Tutarlılık ve Terminoloji
- Dil karmaşası yok: TR UI etiketleri tek sözlükten.
- "Primary CTA" (ör. Kaydet/Çalıştır) her sayfada aynı stil ve hiyerarşiyle.

### 1.4 Veri-Viz (Tableau best practice yaklaşımı)
- Her grafik: **başlık + açıklama + eksen etiketleri + birim**.
- Renk sadece "anlam" taşır; salt süs değil.
- Tablo: zebra + kolon başlığı scope + (varsa) sıralama ikonları.

---

## 2) Layout Standardı (3-kolon zihniyeti)

Spark temel yerleşim: **Sol Nav / Orta içerik / Sağ Copilot (ops panel)**

- Sol Nav: tek navigasyon kaynağı (legacy nav yok).
- Orta: ana görev alanı (formlar, tablolar, grafikler).
- Sağ: Copilot + hızlı aksiyonlar (Ops / öneri / özet).
- Dar ekranlarda: sağ rail collapsible / overlay; içerik öncelikli.

**Kural:** "Önemli bilgi" 1080p'de mümkünse ilk ekranda; değilse net başlıklar ve bölüm ayrımı.

---

## 3) Bileşen Kuralları

### 3.1 Butonlar
- Primary: tek, net (mavi). Focus halkası zorunlu.
- Secondary: gri ton.
- Destructive: kırmızı (onay diyaloğu ile).
- Icon-only: aria-label zorunlu.

### 3.2 Formlar
- Zorunlu alan: `*`
- Inline validasyon: alan altında net mesaj ("Bu alan zorunlu", "Geçersiz format").
- Submit anında: disabled + spinner.
- Başarılı işlem: toast + (varsa) ilgili kartta "success" state.

### 3.3 Durum Rozetleri (StatusBadge)
- Tek kaynak bileşen.
- Durumlar: `connected / paused / stale / error / mock / canary / testnet`
- Her rozetin tooltip'i: kısa açıklama + (varsa) son olay zamanı.

### 3.4 Loading / Empty / Error Şablonları
- Loading: skeleton (layout jitter yok).
- Empty: "Henüz veri yok" + net CTA.
- Error: kısa sebep + "tekrar dene" + (opsiyonel) "kopyala: requestId".

---

## 4) Sayfa Bazlı İş Listesi (D1–D3 Sonrası)

> Bu liste "iş" değil "standart". Her madde uygulanınca sayfa UI parity kazanır.

### 4.1 Ana Sayfa (Dashboard)
- [ ] Ticker/strateji panellerinde skeleton loading
- [ ] Üst barda WS bağlantı durumu göstergesi (Feed/Executor/Engine)
- [ ] Boş durum mesajları + CTA (alarm yoksa "Alarm oluştur")

### 4.2 Piyasa Verileri
- [ ] Grafik başlık/açıklama/eksen/birim zorunlu
- [ ] Tooltip birim/format standardı
- [ ] Staleness görsel uyarı + "pause/resume" davranışı net

### 4.3 Strategy Lab
- [ ] Kaydet/Backtest/Optimize için spinner + başarı/toast
- [ ] Monaco hata çıktısı: inline ve "satıra git" aksiyonu
- [ ] "Run sonrası son loglar" paneli + status (PASS/ATTN/FAIL)
- [ ] Kısayollar: Ctrl+Enter backtest, Ctrl+Shift+O optimize (çakışma kontrol)

### 4.4 Stratejilerim
- [ ] Sayfalama veya sonsuz kaydırma
- [ ] Sil/Düzenle için onay diyaloğu (geri alma opsiyonlu)

### 4.5 Çalışan Stratejiler
- [ ] Sparkline büyüt + tooltip
- [ ] Pause/Resume ikon + metin (ambiguous yok)
- [ ] Durum rozeti: running/paused/error

### 4.6 Portföy
- [ ] Tablo header fixed (scroll'da kaybolmasın)
- [ ] Zebra + kolon sıralama ikonları
- [ ] Güncellenen satır: hafif animasyon vurgusu

### 4.7 Ayarlar
- [ ] Label + aria-describedby tam
- [ ] Tema/dil seçimi tam klavye erişilebilir
- [ ] Kaydet butonu spinner + "son kaydedilme zamanı"

### 4.8 Alerts (Planlanan)
- [ ] Empty state + CTA
- [ ] Alarm oluşturma: inline validasyon + onay akışı

### 4.9 Market Analysis (Planlanan)
- [ ] Grid düzeni: "az ama net" (kafa karıştıran 10 grafik yok)
- [ ] Her grafikte açıklama + metrik tanımı
- [ ] Tooltip: değer + birim + kısa yorum

### 4.10 News (Planlanan)
- [ ] Başlık/özet/haber kaynağı hiyerarşisi net
- [ ] "Etkisi" etiketi (volatilite/risk) opsiyonel

---

## 5) Test ve Kabul Kriterleri (DoD)

- WCAG AA Kontrast: kritik metinler ≥ 4.5:1
- Klavye: tüm interaktif öğeler TAB ile erişilebilir + odak görünür
- Form validasyonu: en az 5 hatalı senaryoda doğru alan altı mesajı
- P95 algılanan yükleme: < 3s; skeleton ile "boş ekran" yok
- Her sayfada en az 1 loading + 1 empty örneği

---

## 6) Evidence (Kanıt) Rutini

Her UI parity PR'ında:
- 2 ekran görüntüsü (before/after) veya kısa gif
- 1 "smoke notu": hangi sayfada ne doğrulandı
- (Varsa) metrik snapshot: staleness, reconnect, msgs_total delta

---

## 7) Sonraki Adım (Önerilen)
- UI parity işleri için "P0/P1" etiketli backlog issue seti aç.
- Strategy Lab ve Dashboard'dan başla (en kritik kullanıcı akışı).
