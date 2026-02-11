# Dashboard Dense Grid - Görsel Doğrulama Checklist

**Tarih:** 26.11.2025
**Hedef:** 1366×768 ekranda scroll'suz, tek bakışta tüm kritik bilgiler

---

## 1. Görsel ve Yerleşim Kontrolü

### A) Scroll Kontrolü
- [ ] **Zoom 100%, 1366×768**
  - [ ] Sayfa scroll bar'ı yok
  - [ ] Strateji tablosu: En az 4-5 satır görünür
  - [ ] Piyasa listesi: En az 6 satır görünür
  - [ ] Haber listesi: En az 6 satır görünür
  - [ ] Copilot paneli: Tam yükseklikte, iç scroll yok

### B) Boşluklar
- [ ] Panel aralarındaki gap: ~10px (göze batmıyor)
- [ ] Header padding'leri minimal (py-1)
- [ ] Başlık satırları içerikten fazla yer kaplamıyor
- [ ] Summary strip kompakt (py-0.5)

### C) Okunabilirlik
- [ ] Sayılar tabular-nums ile hizalı
- [ ] Tablo satırlarında göz kaybı yok
- [ ] Font boyutları: text-xs (10-11px) dense mode için uygun
- [ ] Renk kontrastları WCAG AA uyumlu

---

## 2. Veri İçeriği Kontrolü

### A) Strateji Tablosu
- [ ] En az 3 aktif strateji görünüyor
- [ ] Summary strip dolu:
  - [ ] Toplam strateji sayısı
  - [ ] Günlük toplam P&L (renkli)
  - [ ] Max risk seviyesi
  - [ ] En kârlı strateji adı
- [ ] Her satırda:
  - [ ] Strateji adı + sembol badge
  - [ ] Long/Short + pozisyon büyüklüğü
  - [ ] Entry → anlık fiyat
  - [ ] Günlük P&L + %
  - [ ] Toplam P&L
  - [ ] Risk badge (Low/Med/High)

### B) Piyasa Özeti
- [ ] Header'da breadth + hacim:
  - [ ] Segment adı (Kripto/Hisse/Vadeli/Döviz/Emtia)
  - [ ] Yükselen/düşen sayıları (↑↓)
  - [ ] Toplam hacim (B/M/K formatında)
- [ ] En az 6 enstrüman görünüyor
- [ ] Her satırda:
  - [ ] Sembol
  - [ ] Fiyat (formatlanmış)
  - [ ] 24h % değişim (renkli, ok işareti)
  - [ ] Hacim (kısa format)
  - [ ] Volatilite etiketi (Yüksek/Orta/Düşük)

### C) Haber Akışı
- [ ] Filtre butonları: Tümü | Portföy | Stratejiler
- [ ] En az 6 haber satırı görünüyor
- [ ] Her satırda:
  - [ ] Önem badge'i (Yüksek/Orta/Düşük, renkli)
  - [ ] Başlık (2 satıra kadar, line-clamp-2)
  - [ ] Zaman (örn. "12dk")
  - [ ] Kaynak (kısaltılmış)
- [ ] Yüksek önemli haberler hafif highlight (bg-[var(--err)]/5)

### D) Copilot Paneli
- [ ] Numerik özet barı (3 kolon):
  - [ ] Günlük P&L (renkli)
  - [ ] Açık pozisyon sayısı
  - [ ] Max risk seviyesi (renkli)
- [ ] AI özet bullet listesi:
  - [ ] En az 4 madde görünüyor
  - [ ] Her madde gerçekçi mock veri içeriyor
  - [ ] Önemli değerler vurgulanmış (renkli span'ler)
- [ ] Context bilgileri:
  - [ ] Piyasa: Sembol listesi
  - [ ] Stratejiler: Aktif sayı
  - [ ] Portföy: Durum
- [ ] Composer + hızlı chip'ler görünür

---

## 3. A11y ve Davranış

### A) Klavye Navigasyonu
- [ ] TAB ile:
  - [ ] Sol menü → Dashboard içindeki linkler → Copilot input sırası mantıklı
  - [ ] Focus ring görünür (outline-2)
  - [ ] Tüm interaktif elemanlara erişilebilir

### B) Sekme/Filtre Davranışı
- [ ] Market sekmesi değişince:
  - [ ] Sadece liste içeriği değişiyor
  - [ ] Layout zıplamıyor
  - [ ] Header'daki breadth özeti güncelleniyor
- [ ] Haber filtresi değişince:
  - [ ] Satırlar düzgün güncelleniyor
  - [ ] Boş durum mesajı doğru gösteriliyor

### C) Responsive
- [ ] Desktop (≥1024px):
  - [ ] 12-column grid aktif
  - [ ] Copilot görünür (3 kolon)
  - [ ] Orta alan 9 kolon
- [ ] Mobile (<1024px):
  - [ ] Copilot gizli
  - [ ] Orta alan full width (12 kolon)
  - [ ] Piyasa + Haber alt alta

---

## 4. Lighthouse + Axe Testleri

### A) Lighthouse
- [ ] **Accessibility ≥ 90**
  - [ ] Kontrast oranları yeterli
  - [ ] ARIA etiketleri doğru
  - [ ] Klavye navigasyonu çalışıyor

### B) Axe DevTools
- [ ] **Critical violations = 0**
  - [ ] Renk kontrastı ihlali yok
  - [ ] Eksik ARIA label yok
  - [ ] Klavye tuzakları yok

---

## 5. Optimizasyon Notları

### Yapılan Optimizasyonlar
1. **Header padding'leri:** `py-1.5` → `py-1`, `py-1` → `py-0.5`
2. **Gap değerleri:** `gap-3` → `gap-2.5`
3. **Strateji tablosu yüksekliği:** `max-h-[180px]` → `max-h-[160px]`
4. **Satır sayıları:**
   - Stratejiler: 7 → 5
   - Piyasa: 8 → 6
   - Haber: 8 → 6
5. **Summary strip:** `py-1` → `py-0.5`
6. **Table header:** `py-1` → `py-0.5`

### Eğer Hâlâ Scroll Varsa
- Strateji tablosu satır sayısını 1 azalt (5 → 4)
- Piyasa + Haber satır sayısını toplamda 1-2 azalt (6 → 5)
- Gap değerlerini `gap-2.5` → `gap-2` yap

### Eğer Başlıklar Çok Yer Kaplıyorsa
- Header'lardaki `py-1` → `py-0.5`
- Açıklama alt metinlerini kaldır (sadece başlık)
- Summary strip'i header ile birleştir

---

## 6. Sonuç Kriteri

**Başarılı dense dashboard:**
> "Bu ekrana bakınca hem botların ne yaptığını, hem piyasanın ne yönde aktığını, hem de Copilot'un bundan ne sonuç çıkardığını aynı anda görüyorum."

**Teknik kriterler:**
- ✅ Scroll yok (1366×768)
- ✅ En az 4-5 strateji satırı görünür
- ✅ En az 6 piyasa satırı görünür
- ✅ En az 6 haber satırı görünür
- ✅ Copilot tam yükseklikte
- ✅ Lighthouse Accessibility ≥ 90
- ✅ Axe Critical = 0

---

**Not:** Bu checklist, görsel doğrulama sırasında kullanılmalıdır. Her madde işaretlendikten sonra dashboard "dünya standardı dense" seviyesine ulaşmış sayılır.

