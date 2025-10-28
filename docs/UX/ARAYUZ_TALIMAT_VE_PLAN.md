# Arayüz Talimatları ve Uygulama Planı
## Spark Trading Platform

**Sürüm:** 1.0  
**Tarih:** 28 Ekim 2025  
**Kapsam:** `apps/web-next`

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [WCAG 2.2 AA Uyumluluk](#wcag-22-aa-uyumluluk)
3. [Tasarım Sistemi](#tasarım-sistemi)
4. [CI Gates & Doğrulama](#ci-gates--doğrulama)
5. [Uygulama Backlog](#uygulama-backlog)
6. [Referanslar](#referanslar)

---

## 🎯 Genel Bakış

Spark Trading Platform'un UI/UX stratejisi **erişilebilirlik**, **tutarlılık** ve **kullanıcı deneyimi** odaklıdır. Bu doküman, tüm arayüz geliştirmeleri için **Single Source of Truth (SSoT)** olarak tasarlanmıştır.

### Hedefler

- ✅ WCAG 2.2 AA tam uyumluluk
- ✅ Tasarım sistemi tutarlılığı (tokens, komponentler)
- ✅ CI otomatik doğrulama (Axe, Lighthouse, ESLint)
- ✅ Progressive enhancement (basit kullanıcı → güçlü kullanıcı)
- ✅ Responsive design (mobile-first)

### Bağlam

- **Platform:** Next.js 14 App Router (`apps/web-next`)
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS + CSS Modules
- **CI:** GitHub Actions (Axe, Lighthouse, ESLint)
- **PR gates:** Automated accessibility & performance checks

---

## ♿ WCAG 2.2 AA Uyumluluk

### Temel Prensipler

| **Prensip** | **Açıklama** | **CI Doğrulama** |
|-------------|--------------|------------------|
| **Perceivable** | Bilgiler kullanıcıya sunulabilir olmalı | Axe: Images, ARIA |
| **Operable** | UI bileşenleri kullanılabilir olmalı | Axe: Keyboard, Focus |
| **Understandable** | Bilgiler anlaşılabilir olmalı | ESLint: Semantics |
| **Robust** | Assistive tech'lerle uyumlu olmalı | Lighthouse: A11y Score |

### Zorunlu Standartlar

#### 1. Renk Kontrastı

```css
/* Text (normal): 4.5:1 */
/* Text (large): 3:1 */
/* UI Components: 3:1 */
```

**Örnekler:**
```typescript
// ✅ İyi: WCAG AA uyumlu
<p className="text-text-base">...</p>  // 4.5:1+
<button className="btn-primary">...</button>  // 3:1+

// ❌ Kötü: Düşük kontrast
<p style={{ color: '#aaa' }}>...</p>  // ~2.5:1
```

**CI Doğrulama:** `Lighthouse CI` → `color-contrast` rule

#### 2. Klavye Erişimi

```typescript
// ✅ Zorunlu: Tüm interaktif elementler focusable
<button onClick={...}>...</button>
<a href="...">...</a>
<div role="button" tabIndex={0} onClick={...}>...</div>

// ❌ Yasak: Mouse-only interactions
<div onClick={...} style={{ cursor: 'pointer' }}>...</div>
```

**CI Doğrulama:** `Axe Accessibility Tests` → `keyboard` rules

#### 3. ARIA Etiketleri

```typescript
// ✅ Gerekli ARIA
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="...">...</a></li>
  </ul>
</nav>

// ❌ Eksik: Rol belirsiz
<div>
  <div>...</div>
</div>
```

**CI Doğrulama:** Axe → `aria-*` rules

#### 4. Semantik HTML

```typescript
// ✅ İyi: Uygun tag kullanımı
<article>
  <h1>...</h1>
  <p>...</p>
</article>

// ❌ Kötü: Generic div
<div>
  <div>...</div>
  <div>...</div>
</div>
```

**CI Doğrulama:** ESLint → `@next/next/no-html-link-for-pages`

#### 5. Görsel Alternatifler

```typescript
// ✅ Zorunlu: Alt text
<img src="..." alt="Dashboard overview" />

// ✅ Decorative: Empty alt
<img src="..." alt="" aria-hidden="true" />

// ❌ Yasak: Alt eksik
<img src="..." />
```

**CI Doğrulama:** Axe → `image-alt` rule

---

## 🎨 Tasarım Sistemi

### Renk Tokens

```typescript
// src/styles/theme.css
:root {
  /* Text Colors */
  --color-text-base: #e5e7eb;        /* 4.5:1+ kontrast */
  --color-text-strong: #f9fafb;      /* 7:1 kontrast */
  --color-text-muted: #9ca3af;       /* 3:1 kontrast (large text) */
  
  /* Backgrounds */
  --color-bg-base: #0f0f0f;
  --color-bg-card: #1a1a1a;
  --color-bg-hover: #222222;
  
  /* Accents */
  --color-accent: #3b82f6;           /* Primary blue */
  --color-success: #10b981;          /* Green */
  --color-warning: #f59e0b;          /* Amber */
  --color-error: #ef4444;            /* Red */
  
  /* Borders */
  --color-border: #333333;
  --color-border-hover: #444444;
}
```

### Komponentler

#### Button (Zorunlu: focusable, aria-label)

```typescript
// ✅ Standart button
<button 
  className="btn-primary" 
  onClick={...}
  aria-label="Submit order"
>
  Submit
</button>

// ✅ Link styling (navigation)
<a href="..." className="btn-secondary">
  Portfolio
</a>
```

#### Form Input (Zorunlu: label, aria-describedby)

```typescript
// ✅ Tam erişilebilir form
<div className="form-group">
  <label htmlFor="price" className="input-label">
    Price (TRY)
  </label>
  <input
    id="price"
    type="number"
    className="input"
    aria-describedby="price-help"
    aria-invalid={hasError}
  />
  {hasError && (
    <p id="price-help" className="input-error" role="alert">
      Invalid price
    </p>
  )}
</div>
```

#### Modal/Dialog (Zorunlu: role, aria-modal, focus trap)

```typescript
// ✅ Modal pattern
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Order</h2>
  <button onClick={close} aria-label="Close modal">×</button>
  {/* Focus trap implementation */}
</div>
```

### Typography Scale

```css
/* Headings: h1 → 3xl, h2 → 2xl, h3 → xl */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }

/* Body: base (1rem) → small (0.875rem) */
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
```

### Spacing System

```typescript
// Tailwind: 4px base
const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
};
```

---

## ✅ CI Gates & Doğrulama

### PR #21 CI Checklist

| **Gate** | **Tool** | **Min Score** | **Config** |
|----------|----------|---------------|------------|
| **Axe Accessibility** | @axe-core/react | 0 violations | `.github/workflows/axe.yml` |
| **Lighthouse A11y** | Lighthouse CI | 90+ | `.github/workflows/lighthouse.yml` |
| **ESLint Semantic** | ESLint | 0 errors | `apps/web-next/eslint.config.js` |

### Axe Test Pattern

```typescript
// ✅ Component test
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Submit</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Lighthouse Config

```javascript
// lighthouse-ci.yml
ci:
  collect:
    url: ['http://localhost:3000']
  assert:
    assertions:
      'categories.accessibility': ['error', { minScore: 0.90 }]
      'color-contrast': ['error', { minScore: 1 }]
```

---

## 📝 Uygulama Backlog

### Sprint 1: Foundation (Week 1-2)

- [ ] **Tasarım token'ları standardize et** (`theme.css`)
  - [ ] Text colors (base, strong, muted)
  - [ ] Background colors (base, card, hover)
  - [ ] Accent colors (primary, success, warning, error)
  - [ ] Border colors

- [ ] **Component library güncelle**
  - [ ] Button variants (primary, secondary, ghost)
  - [ ] Input variants (text, number, select)
  - [ ] Modal/Dialog base
  - [ ] Toast notifications

### Sprint 2: Accessibility (Week 3-4)

- [ ] **ARIA implementation**
  - [ ] Navigation landmarks
  - [ ] Form labels & descriptions
  - [ ] Error messages (role="alert")
  - [ ] Live regions (announcements)

- [ ] **Keyboard navigation**
  - [ ] Focus management (traps, restoration)
  - [ ] Skip links
  - [ ] Tab order optimization

### Sprint 3: Forms & Validation (Week 5-6)

- [ ] **Form components**
  - [ ] React Hook Form + Zod integration
  - [ ] Error handling & display
  - [ ] Loading states
  - [ ] Success feedback

- [ ] **Input enhancements**
  - [ ] Auto-complete (aria-autocomplete)
  - [ ] Input masks (price, date)
  - [ ] Validation messages

### Sprint 4: Charts & Data Viz (Week 7-8)

- [ ] **Chart accessibility**
  - [ ] Alt text for charts (aria-label)
  - [ ] Data tables (accessible alternatives)
  - [ ] Color-blind friendly palettes
  - [ ] Keyboard navigation for interactive charts

- [ ] **Loading states**
  - [ ] Skeleton loaders
  - [ ] Progress indicators (aria-live)
  - [ ] Error states (aria-alert)

### Sprint 5: Polish & Testing (Week 9-10)

- [ ] **E2E accessibility tests**
  - [ ] Screen reader testing (NVDA/JAWS)
  - [ ] Keyboard-only navigation flows
  - [ ] Color contrast audit

- [ ] **Performance optimization**
  - [ ] Image optimization (next/image)
  - [ ] Code splitting
  - [ ] Lazy loading

---

## 📚 Referanslar

### WCAG Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Tools

- **Axe DevTools:** Browser extension for runtime testing
- **Lighthouse CI:** CI integration for performance & a11y
- **WAVE:** Visual accessibility testing
- **Pa11y:** CLI accessibility testing

### Next.js Resources

- [Next.js Accessibility](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#accessibility)
- [next/head for metadata](https://nextjs.org/docs/api-reference/next/head)
- [Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

## 📌 Notlar

**Bu talimatlar PR #21'in CI doğrulamalarına uyumludur:**  
- ✅ Axe Accessibility Tests (zero violations)  
- ✅ Lighthouse CI (90+ a11y score)  
- ✅ ESLint semantic rules  

**Doküman güncelleme:**  
- Her major arayüz değişikliğinde bu dokümanı güncelleyin  
- CI gate'ler bu dokümana referans olarak kullanılır  
- Tasarım sistemi değişiklikleri burada belgelenmelidir  

---

**Son güncelleme:** 28 Ekim 2025  
**Versiyon:** 1.0  
**Durum:** ✅ CI Gates'e Uyumlu
