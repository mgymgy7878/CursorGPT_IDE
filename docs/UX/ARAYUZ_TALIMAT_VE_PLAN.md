# ⚡ Spark Trading Platform — Arayüz Talimatı ve Uygulama Planı
**Sürüm:** v1.0 • **Tarih:** 2025-10-27 • **Kapsam:** Web (Next.js App Router)

## 0) Hedef ve İlke Seti
- **Kullanılabilirlik:** NN/g 10 Heuristic ve veri yoğun arayüz best-practice'leri.
- **Erişilebilirlik:** WCAG 2.2 **AA** (klavye erişimi, kontrast, odak yönetimi).
- **Performans:** LCP < **2.5s**, INP < **200ms**, CLS < **0.1** (P95).
- **Tutarlılık:** Tek tasarım sistemi, tek kaynaklı bileşenler, net dil (TR öncelikli).
- **Gözlemlenebilirlik:** Web Vitals RUM + custom UX metrikleri; "evidence-first" yaklaşım.

---

## 1) Bilgi Mimarisi ve Navigasyon
- **Kök rota:** `/` (Dashboard). `(dashboard)` route-group **URL'de görünmez**.
- **Temel rotalar:** `/portfolio`, `/strategies`, `/strategy-lab`, `/running`, `/settings`.
- **Planlanan rotalar:** `/alerts`, `/risk`, `/market`, `/news`.
- **Kurallar**
  - Sol menüde **aktif öğe** vurgulu (hem renk hem left-bar).
  - Üst başlıkta **PageHeader**: başlık, alt başlık, yardımcı eylemler.
  - Breadcrumb yalnızca derin içerikte (≥ 2 hiyerarşi).

---

## 2) Tasarım Sistemi ve Temalar
- **Design Tokens** (CSS custom properties):
  - Renk: `--bg-page`, `--bg-card`, `--text-strong`, `--text-muted`, `--accent`, `--danger`, `--success`, `--warning`
  - Tipografi: `--font-sans`, `--font-mono`, `--size-xs/sm/md/lg/xl`, `--lh-tight/normal`
  - Boşluk: `--space-1..6`
  - Sınır: `--radius-md/xl/2xl`, `--shadow-sm/md`
- **Işık/Koyu:** `prefers-color-scheme` + manuel toggle (persist).
- **Durum renkleri:** `colors.status.{ok, warn, err, paused, unknown}`; kontrast **AA ≥ 4.5:1** zorunlu.
- **Sayı tipografisi:** `.tabular` / `.mono` zorunlu olduğu yerler (tablolar, metrikler).

---

## 3) Bileşen Kuralları (tek kaynaklı)
- **Button**
  - Varyantlar: `primary`, `secondary`, `ghost`, `danger`, `link`.
  - Yükleniyor durumu: spinner + `aria-busy="true"`, buton **disabled**.
  - Klavye: `Enter/Space` çalışır; odak halkası görünür.
- **Link**
  - İç navigasyon: `next/link`; dış bağlantı: `rel="noopener"` + `target="_blank"`.
- **Form**
  - Her input **label** ile bağlı (`for/id`), hata metni `aria-describedby`.
  - Zorunlu alan: `*` + "Zorunlu" metni; inline validasyon.
- **Table**
  - `thead > th[scope="col"]`, satır başına `th[scope="row"]` opsiyonu.
  - Zebra şerit, **sticky header**, görsel sıralama göstergesi (▲▼).
- **Modal**
  - **Focus trap**, kapama: ESC + overlay tıklaması.
  - `aria-modal="true"`, başlık `aria-labelledby`.
- **Toast**
  - Anlık geri bildirim; hata durumunda `role="alert"`.
- **Skeleton**
  - 300ms+ bekleyen veri için kullan; içerik iskeleti sayfa iskeleti ile eşleşir.
- **Tooltip**
  - Bilgilendirici, **kritik bilgi için değil**; `aria-label` alternatifi düşün.
- **StatusBadge / Pill**
  - Tek kaynaklı renk/ikon eşlemesi; metinle birlikte göster (renge bağımlı anlam yok).

---

## 4) Sayfa Bazlı Uygulama Listesi

### 4.1 Ana Sayfa (`/`)
- [ ] **Skeleton** yükleme (hero + 4 metrik kart).
- [ ] **StatusPills**: API/WS/Engine durumu (aria-live="polite").
- [ ] Hızlı eylemler: Strategy Lab, Stratejilerim, Portföy.
- [ ] **Boş durum** mesajları (veri yoksa).

### 4.2 Strategy Lab (`/strategy-lab`)
- [ ] Monaco editor: şablonlar, sözdizimi vurgusu, parametre çıkarımı.
- [ ] **Inline hata**: derleme/backtest hataları ilgili satıra pinned.
- [ ] Kısayollar: **Ctrl+Enter** (Çalıştır), **Ctrl+S** (Kaydet).
- [ ] **Backtest akışı**: Çalıştır → "Koşuyor" durumu → Sonuç linki.

### 4.3 Stratejilerim (`/strategies`)
- [ ] Arama + filtre + sıralama.
- [ ] **Pagination** (≥ 50 kayıt).
- [ ] Silmede **onay diyaloğu**; geri alma (undo 5sn).

### 4.4 Çalışan Stratejiler (`/running`)
- [ ] Sparkline + **tooltip** (son 24h).
- [ ] Durum eylemleri: durdur/duraklat/açıklama — metin etiketli.
- [ ] WS staleness göstergesi (< 30s hedef).

### 4.5 Portföy (`/portfolio`)
- [ ] Sticky header + **zebra** tablo.
- [ ] TR para formatı, **tabular numbers**.
- [ ] Canlı güncellemede **flash highlight** (1s).

### 4.6 Ayarlar (`/settings`)
- [ ] Bölümlü form (genel, bildirimler, görünüm).
- [ ] **Inline validasyon** + alan altı hata.
- [ ] Tema/dil seçiminde klavye erişimi.

### 4.7 Planlananlar
- **Alerts (`/alerts`)**: Boş durum + kural sihirbazı (3 adım).
- **Risk (`/risk`)**: Limitler, exposure, drawdown; status kart + açıklayıcı metin.
- **Market (`/market`)**: "fazla grafik" uyarısı — önceliklendirme ve sekmelere böl.
- **News (`/news`)**: Başlık/özet/hisseler; okuma sırası için tipografik hiyerarşi.

---

## 5) Erişilebilirlik (WCAG 2.2 AA) — Zorunlu Kontrol Listesi
- [ ] **Klavye ile tüm işlevler**: TAB sırası mantıklı, `:focus` görünür.
- [ ] **Kontrast**: Tüm metinlerde **≥ 4.5:1**; ikon/rozet metinle destekli.
- [ ] **Canlı bölgeler**: Durum/sonuç için `aria-live`.
- [ ] **Form**: Etiketli alanlar, hata tanımlı, öneri metinleri.
- [ ] **Hareket**: Otomatik animasyonlar düşük; "reduce motion" desteği.
- [ ] **Dil**: `lang="tr"`; terimler tek dilde (TR) — İngilizce yalnız teknik etiketlerde.

---

## 6) Performans Bütçeleri ve İzleme
- **Sayfa bütçeleri (P95)**: LCP < **2.5s**, INP < **200ms**, CLS < **0.1**.
- **Bundle hedefi**: İlk yük **< 200KB** (gzip); grafik kütüphaneleri **dinamik import**.
- **RUM**: Web Vitals → `/api/vitals` (örnek RUM endpoint); kullanıcı ajanı, route, TTFB/LCP/INP raporla.
- **Önbellek**: SWR stratejileri (stale-while-revalidate), kritik veri için 30–60s.

**Doğrulama komutları (örnek)**
```bash
# Lighthouse (CI)
pnpm exec lighthouse http://127.0.0.1:3003/ --only-categories=performance,accessibility --quiet

# Web Vitals yerel log
curl -s http://127.0.0.1:3003/api/vitals | jq .
```

---

## 7) Test ve Kabul Kriterleri

**Unit**
- Bileşenler: Button, StatusBadge, Table header sort — **%100** case.
- Yardımcılar: formatCurrency, getHealthStatus — sınır değer testleri.

**E2E (Playwright)**
- `/` yüklenir, StatusPills görünür, skeleton→içerik geçişi.
- `/strategy-lab` Ctrl+Enter backtest tetikler; sonuç toast/rail.
- `/strategies` filtre/paging çalışır; silme onayı ve **undo**.

**A11y (otomasyon + manuel)**
- `@axe-core/playwright` kritik hatasız.
- Klavye rotası: menü → içerik → modal → çıkış.

**Kabul (Definition of Done)**
- [ ] WCAG 2.2 AA kontrolleri geçti.
- [ ] Performans bütçeleri P95'de sağlandı.
- [ ] Tüm sayfa görevleri işaretlendi.
- [ ] Evidence dosyaları repo'ya eklendi:
  - `evidence/ui/snapshots/<route>_lighthouse.json`
  - `evidence/ui/a11y/<route>_axe.txt`
  - `evidence/ui/rum/<date>.json`

---

## 8) Uygulama Planı (Sprint'ler)

### Sprint 1 (2 hafta) — **Görünürlük & Erişilebilirlik Temelleri**
- [ ] Skeleton (Ana, Portföy)
- [ ] Aktif menü vurgusu + PageHeader
- [ ] Toast host + inline form validasyon
- [ ] Table: sticky header + zebra
- **Çıktı metrikleri:** A11y ≥ 90, Perf ≥ 90

### Sprint 2 (2 hafta) — **Etkileşim ve Akışlar**
- [ ] Kısayollar (Lab), silme onayı + undo
- [ ] Modal focus trap, ESC/overlay
- [ ] Boş durumlar (Ana, Alerts)
- [ ] Grafik tooltips + açıklamalar

### Sprint 3 (2 hafta) — **WCAG Kapanış + Performans**
- [ ] Kontrast düzeltmeleri
- [ ] Kod bölme (grafik/monaco dinamik import)
- [ ] RUM + metrik panosu (Grafana)
- [ ] A11y E2E + Lighthouse bütçe kapatma

---

## 9) İçerik ve Yerelleştirme (TR)
- Terimler sözlüğü tek kaynak: `packages/i18n`.
- Para biçimi: TR formatı, **tabular numbers**; dar kesintisiz boşluk.
- Karmaşık ikon → **metinli buton** veya tooltip.

---

## 10) Değişiklik Yönetimi
- Tüm UI değişiklikleri PR açıklamasında **UX-ACK**: "Hangi heuristik/WCAG maddesi".
- Her PR'da **evidence** artefaktları zorunlu (Lighthouse + Axe + screenshot).
- "Kırmızı çizgi": Kontrast düşüren, klavye erişimini bozan değişiklik **merge edilmez**.

---

## Ek A — Hızlı Kontrol Kartı (Her PR için)
- [ ] Odak halkası her etkileşimli öğede görünür.
- [ ] Kontrast ≥ 4.5:1 (metin/arka plan).
- [ ] TAB sırası mantıklı; modaldan ESC ile çıkılıyor.
- [ ] Skeleton/boş durum/ hata mesajı hazır.
- [ ] Primary buton tek ve açık etiketli.
- [ ] Dinamik import kritik büyük paketler için aktif.
- [ ] Evidence eklendi (Lighthouse, Axe, screenshot).

## Ek B — Örnek Lighthouse Bütçe

```json
{
  "ci": {
    "collect": { "url": ["http://127.0.0.1:3003/","http://127.0.0.1:3003/portfolio"] },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.90}],
        "categories:accessibility": ["error", {"minScore": 0.90}],
        "unused-javascript": "warn",
        "total-byte-weight": ["warn", {"maxNumericValue": 250000}]
      }
    }
  }
}
```

---

**Hazırlayan:** cursor (Claude Sonnet 4.5)  
**Kaynak:** PROJE_EVRIMI_VE_GELECEK_PLANI_2025_10_27.md temel alınarak hazırlandı  
**Versiyon:** v1.0.0  
**Son Güncelleme:** 2025-10-27

