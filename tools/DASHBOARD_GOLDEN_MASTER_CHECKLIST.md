# Dashboard Golden Master Checklist (Figma Parity)

**Purpose:** Single-page checklist for verifying Figma parity across Dashboard (Ana Sayfa) and related shell components.

**Usage:** Check each item after UI changes, before marking parity as "complete".

---

## 0) Görsel Hijyen

- [ ] %100 zoom (tarayıcı), Windows ölçekleme 100/125 farkında
- [ ] Hard reload (Ctrl+Shift+R) sonrası aynı görünüm
- [ ] Scrollbar/overflow: beyaz leak yok (body/#__next koyu)
- [ ] Splitter handle: normalde silik (white/6), hover'da hafif belirgin (white/12)

---

## 1) Layout / Grid

- [ ] Main/aside arka planı aynı aile: `bg-neutral-950`
- [ ] Splitter handle: normalde silik, hover'da hafif belirgin
- [ ] RightRail genişliği Figma'ya yakın (≈ 420px)
- [ ] Dashboard grid: kartlar arası gap/padding tutarlı (`gap-5`, `p-4`)
- [ ] Portfolio Summary grid: auto-fit (`minmax(180px, 1fr)`) - konteyner genişliğine göre 3/2/1

---

## 2) Surface / Card Standardı

- [ ] Tüm kartlarda radius: `rounded-2xl`
- [ ] Border standardı: `border-white/8` (tutarlı)
- [ ] İç padding standardı: `p-4` (büyük kartlar), `p-3` (mini kartlar)
- [ ] Background: `bg-white/[0.02]` (mini-stat), `bg-neutral-900/80` (Surface card)

---

## 3) Tipografi Standardı

- [ ] Başlık: `text-[13px] font-medium leading-none`
- [ ] Caption: `text-[11px] font-medium leading-none`
- [ ] Value (büyük sayılar): `text-[20px] font-semibold leading-none tabular-nums`
- [ ] Sayılar: `tabular-nums` (PnL, fiyatlar, yüzdeler)
- [ ] Body text: `text-[13px] leading-none`

---

## 4) Portfolio Özeti (Kritik)

- [X] Dashboard top-row container-query: 920px+ → 1.35fr 1fr (Portfolio Summary daha geniş)
- [X] Portfolio mini-stat grid: kart genişliği 560px+ → 3 sütun, 420-559px → 2 sütun, <420px → 1 sütun
- [X] Mini-stat grid: `portfolio-grid` class (container-query ile)
- [X] Mini-stat item: `min-w-0` + `overflow-hidden`
- [X] Value: `min-w-0 truncate` + `title` ile tam değer hover'da
- [X] Label'lar asla "To..." gibi kesilmiyor (truncate yok)
- [X] Mini-stat border: inset shadow (`shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]`) - soft glass hissi
- [X] Overlap yok (her durumda güvenli, container-query ile garantili)

---

## 5) Piyasa Durumu

- [X] Satır yüksekliği: `h-8` (32px) + `items-center`
- [X] Tipografi: `text-[13px] font-medium leading-none`
- [X] Delta format: parantezli `(+1.2%)` / `(−0.5%)` (tek işaret, çift işaret yok)
- [X] Layout: symbol solda `min-w-0 truncate`, price+delta sağda tek grup (`gap-2`, `min-w-0 shrink-0` ile taşma koruması)
- [X] Fiyat rengi: `text-white/80`, delta rengi: `text-emerald-400` / `text-red-400`
- [X] Delta text size: `text-[11px]` (Figma parity)
- [X] Tüm sayılar: `tabular-nums` (kolon kayması yok)
- [X] Up/Down renkleri çok bağırmıyor (soft)

---

## 6) Aktif Stratejiler / Tablolar

- [ ] Header satırı + kolon hizası tutarlı
- [ ] Badge ölçüsü standardı: `h-6 px-2 text-[11px] font-medium`
- [ ] Row divider opaklığı tutarlı (`border-white/8`)
- [ ] Table header: `text-[11px] text-neutral-400 font-medium leading-none`
- [ ] Table body: `text-[13px] text-neutral-200 leading-none`

---

## 7) Risk Durumu

- [ ] Progress bar kalınlığı ve radius tutarlı (`h-2 rounded-full`)
- [ ] "Moderate" badge aynı standarda uyuyor (`h-6 px-2 text-[11px]`)
- [ ] RiskBar label: `text-[11px] font-medium leading-none`
- [ ] RiskBar value: `tabular-nums`

---

## 8) LeftNav (Sidebar)

- [ ] Zemin: `bg-neutral-950`
- [ ] Sağ ayraç: `border-r border-white/8`
- [ ] Active pill: soft (`bg-white/[0.05]` + inset shadow), neon yok
- [ ] Inactive: `text-white/70 hover:bg-white/[0.04]`
- [ ] Icon: `w-[18px] h-[18px]`
- [ ] Label: `text-[13px] font-medium leading-none`
- [ ] Gap: `gap-3`
- [ ] Item height: `h-10`
- [ ] Brand row: `h-14` + `border-b border-white/8`

---

## 9) RightRail (Copilot)

- [ ] Header/section divider çizgileri `border-white/8`
- [X] Quick action pill'ler: `h-8 px-3 rounded-full text-[12px] font-medium`
- [X] Quick action mavi tint: `bg-sky-500/12` + inset outline (`shadow-[inset_0_0_0_1px_rgba(56,189,248,0.16)]`) - soft stroke
- [X] Quick action hover: `bg-sky-500/16` (çok parlama yok)
- [X] Quick action focus: `ring-2 ring-sky-400/30` (SSR-safe)
- [X] Quick action layout: `flex-wrap gap-3` (2 üst + 1 alt satır görünümü)
- [X] FloatingActions (Ctrl+K + Ops Hızlı Yardım): dikey stack (`flex-col gap-2`) - overlap yok
- [ ] Chat bubble radius/padding Figma'ya yakın (`rounded-lg p-3`)
- [ ] Input bar: `text-[13px] font-medium leading-none`
- [ ] System info: `text-[11px] leading-none`

---

## 10) Badge / Pill Standardı

- [ ] Tüm badge'ler: `h-6 px-2 text-[11px] font-medium leading-none`
- [ ] "12 Running", "Moderate", "Canary" tutarlı ölçüde
- [ ] Border: `border-white/8` veya renk-specific (`border-blue-500/30`, `border-amber-500/30`)

---

## 11) Doğrulama

- [ ] `tools\VERIFY_WEBNEXT.cmd` → Dashboard 200 OK
- [ ] `/api/healthz` → 200 (liveness)
- [ ] Executor readiness body içinde doğru raporlanıyor
- [ ] Port 3003 LISTENING
- [ ] Port 4001 (executor) durumu kontrol edildi

---

## 12) Responsive Davranış

- [ ] 1440px genişlik: Portfolio Summary 3 sütun
- [ ] ~1100-1200px: Portfolio Summary 2 sütuna düşebilir
- [ ] Daha dar: Portfolio Summary 1 sütun; value taşmaz, truncate + tooltip çalışır
- [ ] Splitter: çizgi ince ve silik, hover'da biraz belirginleşir
- [ ] RightRail daraltılınca: background sızması yok

---

## 13) Edge Cases

- [ ] Pencere daralt: Portfolio Summary 3 kutu okunur kalsın
- [ ] Splitter'ı sağa-sola çek: hiçbir yerde "kırpma/taşma" olmasın
- [ ] 125% / 150% Windows zoom'da item yüksekliği bozulmuyor (`h-10` sağlam)
- [ ] Scroll: sağ kenarda beyaz boşluk/flash yok

---

**Last Updated:** 2025-01-29
**Status:** In Progress
**Next Review:** After each UI parity iteration

