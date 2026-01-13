# Figma Tasarım Entegrasyonu Rehberi

## 🎨 Figma ile Çalışma Yöntemleri

### 1. Tasarım Token'larını Çıkarma

Figma'dan aşağıdaki bilgileri çıkarıp kod tarafına uygulayabiliriz:

#### Renk Paleti
- Primary colors (ana renkler)
- Background colors (arka planlar)
- Text colors (metin renkleri)
- Semantic colors (success, error, warning, info)
- Border colors

#### Spacing Sistemi
- Base unit (örn: 4px, 8px)
- Spacing scale (4, 8, 12, 16, 24, 32, 48, 64...)
- Padding değerleri
- Margin değerleri
- Gap değerleri

#### Typography
- Font family
- Font sizes (h1, h2, h3, body, caption...)
- Font weights (regular, medium, semibold, bold)
- Line heights
- Letter spacing

#### Border & Radius
- Border widths
- Border radius değerleri
- Shadow değerleri

### 2. Figma'dan Export Yöntemleri

#### A) Design Tokens (JSON)
Figma'dan design token'ları JSON olarak export edebilirsiniz:
- Figma Plugin: "Design Tokens" veya "Figma Tokens"
- Export format: JSON
- Kullanım: `apps/web-next/src/styles/tokens.json`

#### B) CSS Export
Figma'dan CSS export alabilirsiniz:
- Figma → Export → CSS
- Veya Figma Plugin: "CSS Export"
- Kullanım: `apps/web-next/src/app/globals.css` içine entegre

#### C) Asset Export
- İkonlar: SVG formatında
- Görseller: PNG/SVG formatında
- Kullanım: `apps/web-next/public/` veya `apps/web-next/src/assets/`

### 3. Figma Tasarımını Kod Tarafına Uygulama

#### Adım 1: Tasarım Analizi
1. Figma tasarımını inceleyin
2. Component yapısını belirleyin
3. Layout grid'ini çıkarın
4. Spacing ve typography değerlerini not edin

#### Adım 2: Token'ları Güncelleme
```css
/* apps/web-next/src/app/globals.css */
:root {
  /* Figma'dan gelen renkler */
  --figma-primary: #1b7fff;
  --figma-bg: #050608;
  --figma-card: #111318;

  /* Figma'dan gelen spacing */
  --figma-spacing-xs: 4px;
  --figma-spacing-sm: 8px;
  --figma-spacing-md: 16px;
  --figma-spacing-lg: 24px;
}
```

#### Adım 3: Component'leri Güncelleme
Figma tasarımındaki component'leri mevcut React component'lerine uygulayın:
- Layout yapısı
- Spacing değerleri
- Renk kullanımı
- Typography

### 4. Figma Link Paylaşımı

Figma tasarımını paylaşırken:
- **View-only link**: Tasarımı görüntüleyebilirim (renkler, spacing, layout)
- **Dev Mode**: Developer mode'da ölçüler ve spacing değerleri görülebilir
- **Export**: Asset'leri ve token'ları export edebilirsiniz

### 5. Pratik Adımlar

#### Senaryo 1: Hızlı Uygulama
1. Figma tasarımından ekran görüntüsü alın
2. Renk kodlarını (hex) paylaşın
3. Spacing değerlerini (px) paylaşın
4. Ben kod tarafına uygularım

#### Senaryo 2: Detaylı Entegrasyon
1. Figma'dan Design Tokens export edin (JSON)
2. CSS export alın
3. Asset'leri export edin
4. Ben bunları projeye entegre ederim

#### Senaryo 3: İteratif Geliştirme
1. Figma tasarımını bölüm bölüm paylaşın
2. Her bölüm için kod uygulaması yapalım
3. Geri bildirimle iyileştirelim

### 6. Mevcut Dashboard ile Figma Tasarımını Karşılaştırma

Şu anki dashboard yapısı:
- **Layout**: 3 katmanlı (Ortak Çekirdek / Kullanıcı / Copilot)
- **Renkler**: Dark tema token'ları (`--bg`, `--card`, `--fg`)
- **Spacing**: 4px base unit (Tailwind default)
- **Typography**: System fonts, 10px-16px range

Figma tasarımından gelen değerleri mevcut yapıya entegre edebiliriz.

### 7. Örnek: Figma Token'larını Uygulama

```typescript
// Figma'dan gelen değerler
const figmaTokens = {
  colors: {
    primary: "#1b7fff",
    bg: "#050608",
    card: "#111318",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
  typography: {
    h1: { size: 24, weight: 700 },
    body: { size: 14, weight: 400 },
  },
};

// globals.css'e uygulama
:root {
  --figma-primary: #1b7fff;
  --figma-bg: #050608;
  --figma-card: #111318;
}
```

### 8. Sonraki Adımlar

1. **Figma tasarımını paylaşın** (link veya export)
2. **Tasarım analizi yapalım** (renkler, spacing, layout)
3. **Token'ları çıkaralım** (CSS variables)
4. **Component'leri güncelleyelim** (mevcut yapıya uygulama)
5. **Test edelim** (görsel karşılaştırma)

---

**Not**: Figma linkine doğrudan erişimim yok, ancak:
- Figma'dan export edilen dosyaları kullanabilirim
- Tasarım spesifikasyonlarını (renkler, spacing, ölçüler) paylaşırsanız uygulayabilirim
- Ekran görüntüleri üzerinden tasarım analizi yapabilirim


