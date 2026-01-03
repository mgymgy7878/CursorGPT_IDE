# Spark Trading Platform — UX Heuristics ve Erişilebilirlik Bulguları

## Executive Summary
Bu doküman, Spark UI için NN/g heuristics ve WCAG 2.2 AA ekseninde gözlemlenen tipik sorunları ve öncelikli backlog'u özetler.

Öne çıkan temalar:
- **Sistem durumu görünürlüğü**: yükleme, bağlantı, hata ve işlem durumları yeterince net değil.
- **Terminoloji/tutarlılık**: TR/EN karışımı kullanıcı algısını zedeliyor; etiket standardı şart.
- **Gezinim**: aktif sayfa vurgusu ve breadcrumb eksikliği "Neredeyim?" problemini büyütüyor.
- **Erişilebilirlik**: klavye erişimi, kontrast ve aria etiketleme kuralları standardize edilmeli.
- **Form UX**: inline validasyon ve alan bazlı hata mesajları "hata önleme" için kritik.
- **Data-viz**: eksen/birim/tooltip standardı olmadan grafikler karar vermeyi zorlaştırır.

---

## Teşhis Tablosu (Örnek)
| Sayfa | Sorun | İlke | Şiddet | Etki |
|---|---|---|---|---|
| Ana Sayfa | Yükleme/durum göstergesi zayıf | Visibility of System Status | Yüksek | Belirsizlik, güven azalması |
| Ana Sayfa | Aktif menü vurgusu yok | Navigation | Orta | "Neredeyim?" sorunu |
| Strategy Lab | Backtest/Save uzun, geri bildirim zayıf | System Status | Yüksek | Tekrar tıklama/yanlış aksiyon |
| Strategy Lab | Hata mesajı editörden kopuk | Error Recognition | Yüksek | Debug maliyeti artar |
| Stratejilerim | Silme/düzenleme onayı zayıf | User Control & Freedom | Yüksek | Geri dönüşsüz hata riski |
| Portföy | Kontrast/okunabilirlik dalgalı | WCAG Contrast | Orta | Erişilebilirlik riski |

---

## Önceliklendirilmiş Backlog

### High (P0)
- Inline form validasyon + alan bazlı hata mesajları
- Klavye erişilebilirlik (TAB sırası, focus ring), aria-label/aria-describedby standardı
- Sol menü aktif sayfa vurgusu + breadcrumb
- Skeleton + empty-state standartları (Dashboard/StrategyLab/Portfolio)

### Medium (P1)
- Kontrast revizyonu (≥4.5:1) ve token standardı
- Grafiklerde başlık/eksen/birim + tooltip standardı
- Form tasarım standardizasyonu (label, helper text, submit state)

### Low (P2)
- UI tutarlılık: buton boyutu/ikon/typography standardı
- Yardım/mini dokümantasyon: karmaşık alanlarda "?" tooltip
- CTA/ikon netliği: belirsiz ikonlara metin etiketi ekleme

---

## Ölçülebilir Başarı Metrikleri
- Form hata oranı: %50 → %10
- P95 yükleme: < 3s; skeleton görünür
- Erişilebilirlik uyumu: WCAG 2.2 AA otomatik testlerde tam geçiş
- Kritik akış tamamlama: "Strateji oluştur → backtest → run" ilk denemede %95+

---

## Kaynaklar
- NN/g: https://www.nngroup.com/articles/ten-usability-heuristics/
- WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
- Data Viz: https://www.tableau.com/learn/articles/data-visualization-best-practices

