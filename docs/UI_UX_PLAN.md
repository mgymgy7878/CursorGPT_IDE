# Spark Trading Platform — UI/UX Planı ve Uygulama Talimatları (Playbook)

**Amaç:** Spark arayüzünde erişilebilirlik (WCAG 2.2 AA), kullanılabilirlik (NN/g heuristics), tutarlı bilgi mimarisi, güven veren "sistem durumu görünürlüğü" ve trading'e uygun veri görselleştirme standardını tek yerde tanımlamak.

> Bu doküman hem "tasarım kuralı" hem "uygulama backlog'u"dur: yeni sayfa/özellik çıkarken buradaki checklist'ler DoD'nin parçasıdır.

---

## 1) Tasarım İlkeleri (Golden Rules)

### 1.1 Sistem Durumu Görünürlüğü (Trading UI için kritik)
- **Bağlantı durumu** (API/WS/Executor/DEV) üst bar'da her zaman görünür.
- "Veri akışı durdu" durumunda ekranda **boşluk değil**, açıklayıcı **empty/error state** göster.
- Realtime panellerde "son güncelleme zamanı / staleness" net olmalı.

### 1.2 Dil ve Terminoloji Tutarlılığı
- Sol menü + sayfa başlıkları + butonlar **tek dil** (TR) standardında.
- İngilizce terim gerekiyorsa: UI'da TR, tooltip'te EN açıklama.

### 1.3 Navigasyon ve Konum
- Sol menüde aktif öğe vurgusu + sayfa içinde breadcrumb (varsa).
- Kullanıcı "Neredeyim?" sorusunu 1 saniyede cevaplamalı.

### 1.4 Klavye ile Tam Kullanım (WCAG)
- Tüm interaktif öğeler TAB ile erişilebilir.
- Drawer/Modal açılınca focus trap + ESC ile kapanış.
- Kısayollar: Command Palette (Ctrl/⌘ + K), işlem odaklı kısayollar (örn. Strategy Lab run).

### 1.5 Kontrast ve Okunabilirlik
- Metin/arka plan kontrastı **WCAG AA ≥ 4.5:1** hedefi.
- Sayısal değerler için **tabular numbers** (PnL, fiyat, oranlar).

### 1.6 Performans Algısı
- Ağır panellerde **skeleton** + "yükleniyor" durumları.
- Realtime güncellemelerde render-throttle (rafBatch) ve minimal re-render.

---

## 2) Layout Standardı (Spark "3 Kolon" Sistemi)

- **Sol:** Navigation (sabit)
- **Orta:** Page content (scroll container)
- **Sağ:** Copilot/Right rail (persist edilebilir)
- **Üst bar:** Sağlık/çevre rozetleri + hızlı aksiyonlar
- **Floating Actions:** Ekran daralınca kritik aksiyonlara kısa yol

**Kural:** Root scrollbar yerine içerik container scroll (layout jitter'ı azaltır).

---

## 3) Bileşen Kuralları (Design System Contract)

### 3.1 Butonlar
- Primary / Secondary / Danger ayrımı net.
- Icon-only butonlarda **aria-label zorunlu**.
- Focus ring görünür olmalı.

### 3.2 Formlar
- Her input: `label` + `id/for` bağlanacak.
- Zorunlu alanlar: `*` + açıklama (`aria-describedby`).
- Validasyon: inline, alanın yanında; submit sırasında disabled + spinner.

### 3.3 Drawer / Modal (Ops Drawer dahil)
- Controlled open state (store veya parent state).
- ESC ile kapanış + overlay click + close button.
- Açılınca focus içeri alınır, kapanınca tetikleyiciye geri döner.

### 3.4 Skeleton / Loading
- Dashboard, Market Data, Portfolio gibi sayfalarda en az 1 skeleton örneği.
- "Loading" sadece spinner değil, içerik iskeleti ile gelmeli.

### 3.5 Empty State / Error State
- Boş liste: "Henüz yok" + CTA.
- Hata: kısa açıklama + retry + (opsiyonel) "Detaylar" (log id).

### 3.6 Tablo & Grafik
- Tablo: `thead > th[scope="col"]`, zebra pattern, column sort iconları.
- Grafik: başlık + eksen etiketleri + birim + tooltip'te net format (TR).
- Realtime grafiklerde "son update" (staleness) görsel olarak hissedilmeli.

---

## 4) Sayfa Bazlı Backlog (D1–D3 sonrası)

### 🏠 Ana Sayfa (Dashboard)
- [ ] Ticker/strateji kartlarında skeleton
- [ ] Menüde aktif sayfa vurgusu (highlight)
- [ ] WS bağlantı göstergesi (üst bar + tooltip)

### 🧪 Strategy Lab
- [ ] Kaydet/Backtest spinner + başarı/toast
- [ ] Kod hataları için inline açıklama (editor yakınında)
- [ ] Run sonrası "son loglar & status"
- [ ] Kısayollar: Ctrl+Enter (backtest), Ctrl+Shift+O (optimize)

### 📋 Stratejilerim
- [ ] Sayfalama / sonsuz scroll
- [ ] Silme/Düzenle için confirm modal

### 🏃‍♂️ Çalışan Stratejiler
- [ ] Sparkline büyüt + tooltip
- [ ] Pause/Resume ikon+metin
- [ ] Durum rozeti: running/paused/error

### 💼 Portföy
- [ ] Sticky header
- [ ] Zebra + sıralama ikonları
- [ ] Güncellenen satırda hafif animasyon vurgusu

### ⚙️ Ayarlar
- [ ] Label + aria-describedby tam
- [ ] Tema/dil seçimi TAB ile tam gezilebilir
- [ ] Kaydet butonu altında spinner

### 🔔 Alerts (Planlanan)
- [ ] Empty state + CTA ("Yeni alarm oluştur")
- [ ] Form validasyon + onay

### 📊 Market Analysis (Planlanan)
- [ ] Grid düzeni sade
- [ ] Grafiklerde başlık/açıklama/etiket zorunlu
- [ ] Tooltip'te birim + değer formatı

---

## 5) Erişilebilirlik Checklist (DoD'ye girer)

- [ ] Tüm interaktif öğeler TAB ile ulaşılabilir
- [ ] Focus ring görünür
- [ ] Drawer/Modal: ESC ile kapanır, focus trap var
- [ ] Kontrast: AA hedefi
- [ ] Form hataları alan bazında ve anlaşılır
- [ ] Icon-only butonlar aria-label içerir

---

## 6) UI Definition of Done (DoD) Checklist

Her UI değişikliği için aşağıdaki checklist'i kontrol edin:

### ✅ Token Kullanımı
- [ ] Hardcode renk sınıfları (`bg-white`, `text-black`, `border-gray-*`) kullanılmadı
- [ ] Theme token'ları kullanıldı (`bg-card`, `text-card-foreground`, `border-border`)
- [ ] Dark mode için `dark:` prefix'li hardcode sınıflar kullanılmadı
- [ ] `pnpm check:ui-tokens` script'i geçti

### ✅ Empty/Error States
- [ ] Empty state component'i (`EmptyState`) kullanıldı
- [ ] Error state component'i (`ErrorState`) kullanıldı
- [ ] Loading state için `Skeleton` component'i kullanıldı
- [ ] Boş durumlar için kullanıcıya net mesaj verildi

### ✅ Keyboard Navigation
- [ ] ESC tuşu ile modal/drawer kapatılabiliyor
- [ ] Tab ile focus sırası mantıklı
- [ ] Enter/Space ile butonlar çalışıyor
- [ ] Focus ring görünür (`focus-visible`)

### ✅ Accessibility
- [ ] `aria-label` veya `aria-labelledby` kullanıldı (gerekli yerlerde)
- [ ] `role` attribute'ları doğru kullanıldı
- [ ] Kontrast oranları yeterli (WCAG AA minimum)
- [ ] Screen reader test edildi (opsiyonel ama önerilir)

### ✅ Responsive Design
- [ ] Mobile görünüm test edildi (< 768px)
- [ ] Tablet görünüm test edildi (768px - 1024px)
- [ ] Desktop görünüm test edildi (> 1024px)
- [ ] Overflow durumları handle edildi

### ✅ Visual Consistency
- [ ] Spacing token'ları kullanıldı (`--space-*`)
- [ ] Border radius tutarlı (`rounded-xl`, `rounded-2xl`)
- [ ] Shadow tutarlı (`shadow-sm`, `shadow-lg`)
- [ ] Typography scale tutarlı (`text-sm`, `text-lg`, `text-2xl`)

### ✅ Performance
- [ ] Lazy loading kullanıldı (büyük component'ler için)
- [ ] Image optimization yapıldı (`next/image` kullanıldı)
- [ ] Unnecessary re-render'lar önlendi (`useMemo`, `useCallback`)
- [ ] Bundle size artışı kontrol edildi

### ✅ Testing
- [ ] Visual smoke test geçti (`pnpm ui:test:visual`)
- [ ] E2E test eklendi (kritik user flow'lar için)
- [ ] TypeScript type errors yok (`pnpm typecheck`)
- [ ] Linter errors yok (`pnpm lint`)

### ✅ Documentation
- [ ] Component props dokümante edildi (JSDoc)
- [ ] Kullanım örneği eklendi (gerekirse)
- [ ] Breaking changes dokümante edildi (varsa)

**Not:** Bu checklist her PR'da kontrol edilmeli. CI otomatik olarak token lockdown ve visual smoke testlerini çalıştırır. Detaylar için: [UI_GUARDRAILS.md](./UI_GUARDRAILS.md)

## 7) Test ve Kabul Kriterleri (Ölçülebilir)

| Test | Kriter |
|---|---|
| WCAG AA Kontrast | Metin kontrastı ≥ 4.5:1 |
| Klavye Erişimi | Tüm işlevler klavye ile yapılır |
| Form Validasyon | 5/5 hatalı senaryo yakalanır |
| Yükleme (P95) | < 3s ve skeleton gösterimi var |
| Skeleton/Empty State | Her kritik sayfada en az 1 örnek |

---

## 8) Kanıt (Evidence) Standardı

UI değişikliklerinde aşağıdaki kanıtlar eklenir:
- `evidence/ui/<tarih>_<konu>_before.png`
- `evidence/ui/<tarih>_<konu>_after.png`
- `evidence/ui/<tarih>_<konu>.md` (ne değişti + hangi checklist PASS)

---

## 9) Kaynaklar (iç referans)
- NN/g Heuristics, WCAG 2.2 quickref, Tableau DataViz best practices
- Proje içi UI/UX plan ve araştırma çıktıları (repo'da arşivlenir)
