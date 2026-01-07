# Hız Modu — UI Ping-Pong'u Bitirme Kuralları

**Amaç:** Figma↔UI ping-pong'unu bitirip ürün ilerleten işlere odaklanmak.

## Temel Prensipler

### 1. Figma = Tasarım Niyeti, Tek Kaynak Gerçek Değil

- Figma'yı "tasarım niyeti" olarak saklıyoruz
- Ürün gerçekliği: **UI tokens + Golden Master (screenshot-diff)**
- Figma'ya sürekli geri dönüş YASAK

### 2. Done Tanımı (P0 Odak)

**Sadece şunlar "hemen fix":**
- ✅ Üst üste binme / taşma / kesilen kritik bilgi
- ✅ Tıklanamaz alan / overlay çakışması
- ✅ Okunabilirliği bozan kontrast / font hatası

**Geri kalan her "mikro parity" işi P2 tasarım borcu.**

### 3. Değişiklik Döngüsü (Otomatik)

```bash
# UI değişikliği sonrası
pnpm ui:diff

# Geçti mi? → BİTTİ. Yeni mikro rötuş açma.

# Bilinçli görsel değişim
pnpm ui:snap
git add apps/web-next/tests/visual/snapshots/
git commit -m "ui: update dashboard snapshots"
```

### 4. Tek Seferde Tek Hedef (Scope Kilidi)

- Bir PR/patch = tek problem sınıfı
- "Hem pill ölçüsü hem spacing hem renk" = çamur ❌
- Minimum dosyada tut

### 5. Figma'ya Geri Dönüş Ritmi

- Sürekli değil ❌
- Sadece "büyük component/flow" çıkınca kısa kalibrasyon ✅
- Yoksa sonsuz döngü

## Patch Sonrası Checklist

Her patch sonunda şunları çalıştır:

```bash
# 1. UI diff kontrolü
pnpm ui:diff

# 2. Type check
pnpm --filter web-next typecheck

# 3. Lint (varsa)
pnpm --filter web-next lint
```

**ui:diff geçiyorsa → DUR. Yeni "mikro rötuş" açma.**

## Çıktı Formatı

Her patch için:

```
PATCH (dosya listesi + net diff özeti)
SMOKE TEST (komutlar + sonuç)
REGRESSION MATRIX (etkilenen sayfalar/viewportlar)
DESIGN-DEBT (P2 maddeleri: 1-2 cümle)
```

## Ürün İlerleten İşlere Geçiş

UI tarafında artık hedef: **stabil + testle korunan**

Sonra direkt:

1. **BTCTurk + BIST reader** (data akışı kanıtı)
2. **Guardrails** (risk kapıları)
3. **Backtest/optimizer** (kanıt üreten motor)
4. **Observability** (P95/RT delay gibi metrikler)

**UI'ı mükemmelleştirmek yerine, trade motorunu mükemmelleştirip UI'ı "yeterince iyi" seviyesinde dondurmak = gerçek hız.**

## Örnek: Portfolio Summary 3'lü Dizilim

**Figma'da:** Çoğu durumda 3'lü
**Uygulamada:** Bazen 2+1 diziliyor

**Hız Modu Kararı:**
- ✅ Okunabilirlik ve taşma yoksa → **KABUL** (P2 backlog)
- ❌ "3'lü olmak zorunda" diyorsak → Token/threshold ile **bir kez** çözülür, konu kapanır

**Her gün kurcalanmaz.**

## Debug Değil, İlerleme

Bu noktadan sonra:
- ❌ "Figma'daki milim" kovalamak
- ✅ "P0 hatayı kapat, diff geçsin, yürü" disiplini

**UI stabil + testle korunuyor + feature'lara geri dönüyoruz.**

