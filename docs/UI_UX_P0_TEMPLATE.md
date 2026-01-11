# UI-P0 Şablon - Sonraki P0 İşleri İçin

Bu doküman, UI-P0-001'i tamamladıktan sonra sonraki P0 işleri için kullanılacak şablonu içerir.

**Referans:** UI-P0-001 (Dashboard skeleton & empty/error states) - Golden sample

---

## 🎯 Şablon Yapısı

### 1. Issue Oluşturma

**Template:** UI/UX Improvement

**Başlık:**
```
UI-P0-XXX: [Sayfa Adı] skeleton & empty/error states
```

**Label'lar:**
- `ui-ux`
- `ui-ux:p0`
- `area:[sayfa-adı]` (örn: `area:strategy-lab`)

**Template Alanları:**
- Hedef Sayfa: `/[sayfa-adı]` (§3.x)
- Öncelik: P0 (Kritik) ✅
- Mevcut Durum: [Sayfa özelinde mevcut durum]
- İstenen: Skeleton state, boş durum ekranı, loading durumları
- Kabul Kriterleri: Skeleton görünür, boş durum açıklayıcı, Lighthouse ≥ 90
- İlgili Issue: Epic issue numarası

---

### 2. Branch Oluşturma

```bash
git checkout -b ui-ux/ui-p0-xxx-[sayfa-adı]-skeleton
```

**Örnek:**
```bash
git checkout -b ui-ux/ui-p0-002-strategy-lab-skeleton
```

---

### 3. Component'leri Oluşturma

UI-P0-001'deki pattern'i kopyala:

1. **`[SayfaAdı]Skeleton.tsx`**
   - UI-P0-001'deki `DashboardSkeleton.tsx` pattern'ini kullan
   - Sayfa özelinde kart/widget'ları skeleton'a çevir
   - `aria-busy="true"`, `aria-live="polite"` ekle

2. **`[SayfaAdı]EmptyState.tsx`**
   - UI-P0-001'deki `DashboardEmptyState.tsx` pattern'ini kullan
   - Sayfa özelinde boş durum mesajı ve CTA'ları ekle
   - Min 44×44px butonlar, `aria-label` ekle

3. **`[SayfaAdı]ErrorState.tsx`**
   - UI-P0-001'deki `DashboardErrorState.tsx` pattern'ini kullan
   - `role="alert"`, retry butonu ekle

**Dosya Yapısı:**
```
apps/web-next/src/components/[sayfa-adı]/
├── [SayfaAdı]Skeleton.tsx
├── [SayfaAdı]EmptyState.tsx
└── [SayfaAdı]ErrorState.tsx
```

---

### 4. Sayfa Güncelleme

**Pattern (UI-P0-001'den):**

```typescript
type [SayfaAdı]State =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "empty" }
  | { status: "success" };

export default function [SayfaAdı]Page() {
  const [state, setState] = useState<[SayfaAdı]State>({ status: "loading" });

  // Telemetry (isteğe bağlı)
  useDashboardTelemetry(state); // veya sayfa özelinde hook

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState({ status: "loading" });
        // API fetch logic
        // Empty check
        // Success
      } catch (error) {
        setState({ status: "error", error: ... });
      }
    };
    fetchData();
  }, []);

  if (state.status === "loading") return <[SayfaAdı]Skeleton />;
  if (state.status === "error") return <[SayfaAdı]ErrorState ... />;
  if (state.status === "empty") return <[SayfaAdı]EmptyState />;

  // Success state - normal content
  return (...);
}
```

---

### 5. Test Oluşturma

**E2E Test:**
- `tests/e2e/[sayfa-adı]-states.spec.ts`
- UI-P0-001'deki `dashboard-states.spec.ts` pattern'ini kullan
- Senaryolar: Loading, Empty, Error, Success, Keyboard navigation

**Manuel Test:**
- `UI_UX_MANUAL_TEST_SCENARIOS.md` dosyasına sayfa özelinde senaryolar ekle

---

### 6. PR Açma

**Başlık:**
```
UI-P0-XXX: [Sayfa Adı] skeleton & empty/error states
```

**Body:**
- `.github/PULL_REQUEST_TEMPLATE_UI_P0_001.md` şablonunu kullan
- Sayfa özelinde güncelle (component isimleri, sayfa referansları)

**Evidence:**
- Screenshot'lar (Before, After - Loading, Empty, Error)
- Lighthouse raporu (Accessibility ≥ 90)
- Axe sonucu (Critical = 0)

---

## 📋 Checklist: Sonraki P0 İşi İçin

### Hazırlık
- [ ] Issue oluşturuldu (UI/UX Improvement template)
- [ ] Branch oluşturuldu (`ui-ux/ui-p0-xxx-[sayfa-adı]-skeleton`)
- [ ] UI-P0-001 pattern'leri incelendi

### Geliştirme
- [ ] Skeleton component oluşturuldu
- [ ] Empty state component oluşturuldu
- [ ] Error state component oluşturuldu
- [ ] Sayfa state yönetimi eklendi
- [ ] Shell sürekliliği sağlandı (LeftNav + CopilotDock)

### Test
- [ ] E2E test oluşturuldu
- [ ] Manuel test senaryoları hazırlandı
- [ ] `typecheck` geçti
- [ ] `lint` geçti
- [ ] `test:e2e` geçti

### Doğrulama
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Axe Critical violations = 0
- [ ] Screenshot'lar hazırlandı
- [ ] Klavye navigasyonu test edildi

### PR
- [ ] PR açıldı
- [ ] PR template dolduruldu
- [ ] Evidence eklendi
- [ ] Issue bağlandı (`Closes #...`)

---

## 🎯 Sonraki P0 İşleri

### UI-P0-002: Strategy Lab
- **Sayfa:** `/strategy-lab`
- **Referans:** §3.2
- **Özel:** Copilot chat + code editor + parametre formu için skeleton

### UI-P0-003: Portfolio + Market
- **Sayfalar:** `/portfolio`, `/market`
- **Referans:** §3.5, §3.6
- **Özel:** Tablo ve grafik skeleton'ları

### UI-P0-004: Backtest
- **Sayfa:** `/backtest`
- **Referans:** Backtest sonuç ekranı
- **Özel:** Uzun süren işlemler için loading state

### UI-P0-005: Global Form Validation
- **Kapsam:** Tüm formlar
- **Referans:** §2.4
- **Özel:** Inline validation pattern'i

---

## 💡 İpuçları

### Pattern Tekrarı
- UI-P0-001'deki pattern'leri **birebir kopyala**, sadece isimleri değiştir
- State modeli aynı kalacak
- Component yapısı aynı kalacak
- Test yapısı aynı kalacak

### Sayfa Özelleştirmeleri
- Her sayfa için sadece **içerik** değişir, **pattern** aynı kalır
- Skeleton: Sayfa özelinde kart/widget'lar
- Empty: Sayfa özelinde mesaj ve CTA'lar
- Error: Genelde aynı (retry butonu)

### Hızlandırma
- UI-P0-001'i "golden sample" olarak kullan
- Copy-paste ile başla, sonra özelleştir
- Test senaryolarını da kopyala, sadece sayfa URL'lerini değiştir

---

## 📚 Referanslar

- [UI-P0-001 Implementation Guide](./UI_UX_IMPLEMENTATION_GUIDE.md)
- [UI/UX Talimatları](./UI_UX_TALIMATLAR_VE_PLAN.md)
- [Manuel Test Senaryoları](./UI_UX_MANUAL_TEST_SCENARIOS.md)
- [PR Template](../.github/PULL_REQUEST_TEMPLATE_UI_P0_001.md)

---

**Son Güncelleme:** 26.11.2025
**Golden Sample:** UI-P0-001 (Dashboard)

