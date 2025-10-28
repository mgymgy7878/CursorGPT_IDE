# Spark — UI/UX Talimatları ve Uygulama Planı (v1.0)

> Tek kaynak (SSoT) — Arayüz kararları, erişilebilirlik kuralları, bileşen standartları ve sayfa bazlı yapılacaklar.

## 1) İlkeler (kısa ve bağlayıcı)
- **Tutarlılık:** Tek tip tipografi, buton hiyerarşisi, boşluk (8px grid), durum renkleri (success/warn/danger/info).
- **Erişilebilirlik (AA):** Tüm etkileşimler klavye ile yapılabilir; kontrast ≥ 4.5:1; odak halkaları gizlenmez.
- **Geri Bildirim:** Her asenkron işlemde skeleton/loader ve durum mesajı; başarısızlıkta alan bazlı hata metni.
- **Sadelik:** Her ekranda tek bir birincil eylem; ikincil eylemler görsel hiyerarşide geri planda.
- **Ölçülebilirlik:** Her özelliğin "başarı metriği" UI'dan gözlenebilir ve Prometheus'a yansır.

## 2) Tasarım Token'ları (özet)
- **Renkler:** `--bg-page`, `--bg-card`, `--text-strong`, `--text-muted`, `--brand`, `--success`, `--warn`, `--danger`.
- **Tipografi:** Başlık: `text-2xl/semibold`, gövde: `text-sm/regular`, sayısal metinlerde `.tabular .mono`.
- **Boşluk:** 8px taban; kart içi `p-4`, sayfa kenarları `px-6 py-6`.
- **Odak:** `ring-2 ring-blue-500` (hem light hem dark için görünür).

## 3) Erişilebilirlik Kontrol Listesi (AA)
- [ ] Tüm buton/ikonlar: `aria-label` veya görünen metin
- [ ] Form alanları: `label for=id` eşleştirmesi
- [ ] Hata mesajı: alanın hemen altında, programatik ilişki (`aria-describedby`)
- [ ] Odak sırası: TAB akışı görsel sırayla uyumlu
- [ ] Canlı güncellemeler: `aria-live="polite"` (kritik: `"assertive"`)
- [ ] Kontrast: metin/arka plan ≥ 4.5:1 (otomatik test + manuel spot check)

## 4) Bileşen Standartları
- **Button (Primary/Secondary/Danger):** Metin zorunlu; yalnız ikon kullanımı yasak (tooltip harici).
- **FormField:** Hata durumu (`invalid`), yardımcı metin, zorunlu alan `*` işareti; inline validasyon.
- **StatusBadge:** Tek kaynak (health/durum etiketleri burada toplanır).
- **Skeleton:** Kart ve tablo sürümleri; veri beklerken her sayfada zorunlu.
- **Metric Card:** Başlık, değer, alt bilgi; sayı alanları `.num-tight`.

## 5) Bilgi Mimarisi ve Navigasyon
- **Sol menü:** Aktif sayfa bariz highlight; ikon + metin; hover → tooltip.
- **Konumlandırma:** Üstte sayfa başlığı + kısa açıklama; gerekiyorsa breadcrumb.
- **Terimler:** TR/EN karışımı yok; proje diline göre tek dil.

## 6) Sayfa Bazlı Görevler (MVP tamam/eksik)
### Dashboard
- [ ] Health widget'ları: WS staleness, Kill switch, Backtest p95
- [ ] Skeleton ve boş durum mesajları
- [ ] "Son aksiyonlar" listesi (gelecek)

### Strategy Studio
- [x] Strategy Wizard (3 adım) + CodeEditor entegrasyonu  
- [x] Backtest Runner (SSE) + ilerleme çubuğu  
- [ ] Backtest raporunda eksen/etiket/özet metrikler (şimdi ekle)
- [ ] Klavye kısayolları: Çalıştır (Ctrl/Cmd+Enter), Kaydet (Ctrl/Cmd+S)

### Guardrails
- [x] Kill switch + exposure cap UI  
- [ ] Whitelist düzenleyici (çoklu etiket girişi, validasyon)  
- [ ] Politika dosyası persist (policy.json) — sonraki sprint

### Observability
- [x] Kartlar (WS, Kill Switch, Backtest P95)
- [ ] Kartlarda detay modali (grafik + son 24 saat)

### Portfolio
- [ ] Kontrast ve tablo başlıkları (thead, scope)
- [ ] Otomatik "güncelleniyor" göstergesi (SWR mutate/interval)

## 7) Ölçülebilir Başarı Metriği (UI tarafı)
- **Erişilebilirlik:** Otomatik denetimde 0 kritik; manuel kontrast spot kontrol PASS
- **Kullanılabilirlik:** Strategy Wizard'da "ilk denemede tamamlanma" ≥ %95
- **Geri Bildirim:** Backtest başlat → ilk görsel ilerleme ≤ 700 ms
- **Perf (UI algısı):** Skeleton görünme süresi ≤ 400 ms; FCP hedefi ≤ 2 s (dev: mock, prod: real)

## 8) Uygulama Planı (2 hafta)
**Hafta 1**
1. (P0) Strategy Studio rapor grafikleri — eksen/başlık/legend
2. (P0) Form alanı hata metinleri → tüm ekranlara yay
3. (P0) Kontrast düzeltmeleri (AA) — token revizyonu
4. (P1) Klavye kısayolları (Run/Save)

**Hafta 2**
1. (P0) Guardrails whitelist editörü + doğrulama
2. (P1) Observability detay modali (mini grafik)
3. (P1) Portfolio tablo erişilebilirliği (thead/scope/aria)
4. (P2) Yardım balonları (i) ikonu ile mikro açıklamalar

## 9) Kabul Kriterleri (Done tanımı)
- `pnpm -F web-next typecheck` → **0 hata**
- Erişilebilirlik hızlı test: Axe "serious/critical" **0**
- Tüm buton/input'lar klavye ile erişilebilir
- Kritik akışlar (Wizard → Backtest) tek denemede tamamlanır
- Kontrast spot test: 10 örneğin **10/10 PASS**

## 10) Geliştirici Notları
- **Bileşen tek kaynağı:** StatusBadge, Button, FormField dışına stil kaçırma
- **Skeleton zorunlu:** Ağ isteği başlatan her sayfada
- **İsimler:** TR dilinde, "Strategy Lab" gibi karışık etiket yok
- **Test:** Playwright kısa senaryolar (Wizard tamamlanır, Backtest ilerler)

