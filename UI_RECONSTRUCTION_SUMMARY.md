# UI Yeniden Yapılandırma Özeti - 27 Aralık 2025

## cursor (Claude 4.1 Opus): UI Sadeleştirme ve Density İyileştirmeleri

### STATUS: 🟢 BAŞARILI

---

## Yapılan Değişiklikler

### 1. Sayfa Birleştirme (Navigation Sadeleştirme) ✅

**Öncesi:** 12+ menü öğesi
**Sonrası:** 6 ana menü öğesi

**Yeni Sayfa Yapısı:**
- ✅ `/dashboard` - Ana sayfa (kaldı)
- ✅ `/market-data` - Piyasa Verileri (kaldı)
- ✅ `/running` - Çalışan Stratejiler (kaldı)
- ✅ `/strategies` - Stratejilerim (kaldı, Strategy Lab tab eklendi)
- ✅ `/control` - **YENİ:** Operasyon Merkezi (tabs: Risk, Alerts, Audit, Canary)
- ✅ `/settings` - Ayarlar (kaldı)

**Birleştirilen Sayfalar:**
- `/guardrails` → `/control?tab=risk`
- `/alerts` → `/control?tab=alerts`
- `/audit` → `/control?tab=audit`
- `/canary` → `/control?tab=canary`
- `/strategy-lab` → `/strategies?tab=lab`

**Portfolio Entegrasyonu:**
- Portfolio sayfası sidebar'dan kaldırıldı
- Dashboard'da zaten "Portföy Özeti" kartı mevcut
- Detay gerekirse Dashboard'dan erişilebilir

### 2. Sidebar Menüsü Sadeleştirme ✅

**Güncellenen Dosya:**
- `apps/web-next/src/components/left-nav.tsx`

**Değişiklikler:**
- Menü öğeleri 12'den 6'ya indirildi
- Birleştirilen sayfalar kaldırıldı
- Portfolio sidebar'dan kaldırıldı
- Strategy Lab sidebar'dan kaldırıldı (strategies tab'ında)

### 3. Redirect'ler ✅

**Güncellenen Dosyalar:**
- `apps/web-next/src/app/(shell)/alerts/page.tsx` → `/control?tab=alerts`
- `apps/web-next/src/app/(shell)/guardrails/page.tsx` → `/control?tab=risk`
- `apps/web-next/src/app/(shell)/audit/page.tsx` → `/control?tab=audit`
- `apps/web-next/src/app/(shell)/canary/page.tsx` → `/control?tab=canary`
- `apps/web-next/src/app/(shell)/strategy-lab/page.tsx` → `/strategies?tab=lab`

### 4. Yeni Control Sayfası ✅

**Yeni Dosya:**
- `apps/web-next/src/app/(shell)/control/page.tsx`

**Özellikler:**
- Tab-based navigation (Risk, Alerts, Audit, Canary)
- Mevcut component'ler reuse edildi:
  - RiskProtectionPage
  - AlertsPageContent
  - AuditTable
  - Canary content (inline)

### 5. Strategy Lab Tab Entegrasyonu ✅

**Güncellenen Dosya:**
- `apps/web-next/src/app/(shell)/strategies/page.tsx`

**Değişiklikler:**
- Strategy Lab artık `/strategies` içinde tab olarak mevcut
- "Liste" ve "Lab" tab'ları eklendi
- StrategyLabHeader ve StrategyLabContent component'leri entegre edildi

### 6. Density Token'ları ✅

**Güncellenen Dosya:**
- `apps/web-next/src/styles/uiTokens.ts`

**Yeni Token'lar:**
- `tableRowHeight: 'h-11'` (44px)
- `headerRowHeight: 'h-9'` (36px)
- `statPill` (stat card yerine pill)
- `cardPadding` ve `cardPaddingLarge` ayrımı

---

## Sonuç

### Başarılı Tamamlanan Görevler ✅

1. ✅ Yeni /control sayfası oluşturuldu
2. ✅ Sidebar menüsü 6 öğeye indirildi
3. ✅ Tüm redirect'ler eklendi
4. ✅ Strategy Lab /strategies tab'ına entegre edildi
5. ✅ Portfolio sidebar'dan kaldırıldı (Dashboard'da mevcut)
6. ✅ Density token'ları eklendi

### Geriye Kalan İşler

1. ⏳ Density kurallarının component'lere uygulanması (büyük refactor gerektirir)
2. ⏳ Kart padding'lerin p-6'dan p-4'e düşürülmesi (kritik kartlar hariç)
3. ⏳ Table row height'ların 44-48px'e sabitlenmesi
4. ⏳ Stat card'ların pill/badge'e dönüştürülmesi
5. ⏳ Empty state'lerin inline hale getirilmesi

**Not:** Density kurallarının tam uygulanması için component bazlı refactor gerekiyor. Bu, planlanan bir sonraki adım olarak ayrı bir PATCH seti olarak ele alınabilir.

---

## Yeni Route Yapısı

```
/dashboard          → Ana sayfa (Portfolio özeti dahil)
/market-data        → Piyasa verileri
/running            → Çalışan stratejiler
/strategies         → Stratejilerim + Lab (tabs)
  ?tab=list         → Liste görünümü
  ?tab=lab          → Strategy Lab
/control            → Operasyon Merkezi (tabs)
  ?tab=risk         → Risk & Kill Switch
  ?tab=alerts       → Uyarılar
  ?tab=audit        → Denetim / Loglar
  ?tab=canary       → Release Gate
/settings           → Ayarlar
```

**Eski Route'lar (Redirect):**
- `/guardrails` → `/control?tab=risk`
- `/alerts` → `/control?tab=alerts`
- `/audit` → `/control?tab=audit`
- `/canary` → `/control?tab=canary`
- `/strategy-lab` → `/strategies?tab=lab`

---

## Sonraki Adımlar

1. **Density Refactor (PATCH C):**
   - Component bazlı padding/typography güncellemeleri
   - Table row height standardizasyonu
   - Stat card → pill dönüşümü

2. **UI Polish:**
   - Tab transition animasyonları
   - Hover state'leri
   - Loading state'leri

3. **Test:**
   - Tüm redirect'lerin çalışması
   - Tab navigation'ın sorunsuz çalışması
   - Component'lerin doğru render edilmesi

---

**Durum:** ✅ Temel yapı tamamlandı. Density refactor için ayrı PATCH seti hazırlanabilir.

