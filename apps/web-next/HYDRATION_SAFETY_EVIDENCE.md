# 🛡️ HYDRATION SAFETY - EVIDENCE PACKAGE

**Tarih:** 2025-01-15
**Durum:** ✅ PRODUCTION-READY (Kanıt Paketi)

---

## 📋 KANIT KONTROL LİSTESİ

### 1. ✅ Hydration Warning = 0 Kanıtı

**Adımlar:**
1. Chrome DevTools → Console aç
2. Filtreye `hydration` yaz
3. Kritik sayfaları gez:
   - `/dashboard`
   - `/market-data`
   - `/strategies`
   - `/running`
   - `/control?tab=audit`
   - `/control?tab=alerts`
   - `/control?tab=canary`
   - `/settings`
4. Her sayfada **Hard Reload** (Ctrl+Shift+R)
5. Console'da "Hydration failed" veya "Hydration mismatch" mesajı **YOK**
6. Screenshot al → `evidence/local/hydration-safety-console-clean.png`

**Beklenen Sonuç:**
```
Console: (0 errors, 0 warnings)
Filter: "hydration" → No results
```

---

### 2. ✅ Layout Shift Kanıtı

**Adımlar:**
1. `/running` veya `/control?tab=audit` sayfasını aç
2. Relative time'ları gözlemle (örn: "2 dk önce", "15 dk önce")
3. **2 dakika** sayfayı açık bırak (relative time akar)
4. Satırların yüksekliği/kolon genişliği **zıplamıyor**
5. Screenshot al (önce/sonra) → `evidence/local/hydration-safety-layout-stable.png`

**Beklenen Sonuç:**
- Tablo satırları sabit yükseklikte
- Relative time kolonları genişlemiyor
- `min-w-[10ch]` ile layout shift yok

---

### 3. ✅ Ticker Throttle Kanıtı (Opsiyonel)

**Adımlar:**
1. Chrome DevTools → Performance panel aç
2. Recording başlat
3. `/running` sayfasını aç (relative time'lar var)
4. **Tab'ı arka plana al** (başka sekmeye geç)
5. 10 saniye bekle
6. Recording durdur
7. CPU/re-render düşüşü kontrol et

**Beklenen Sonuç:**
- Tab görünürken: ~1 re-render/saniye (1Hz)
- Tab gizliyken: ~0.2 re-render/saniye (0.2Hz = 5 saniyede bir)
- CPU kullanımı düşüyor

---

### 4. ✅ Mini Regresyon Matrisi (5 Dakikalık)

#### a) Settings / Connection Health
- [ ] Status bar ile birebir aynı (API/WS/Executor)
- [ ] Executor offline olduğunda tooltip gösteriliyor
- [ ] "Son test" timestamp doğru gösteriliyor

#### b) Control / Risk
- [ ] "Son: ... önce" min-width sabit (zıplama yok)
- [ ] Tooltip'te datetime doğru gösteriliyor
- [ ] Format tutarlı: `sn` / `dk` / `sa` / `gün`

#### c) Running/Strategies Tabloları
- [ ] Satır yüksekliği oynamıyor
- [ ] Kolon genişliği oynamıyor
- [ ] Relative time'lar `min-w-[10ch]` ile sabit

#### d) Alerts Demo Listesi
- [ ] "dk/sn/sa" formatı tutarlı
- [ ] Tooltip'te tam datetime gösteriliyor
- [ ] Layout shift yok

---

## 📸 SCREENSHOT KAYITLARI

### Hydration Warning = 0
**Dosya:** `evidence/local/hydration-safety-console-clean.png`
**Açıklama:** Chrome DevTools Console, hydration filtresi, 0 hata

### Layout Shift Yok
**Dosya:** `evidence/local/hydration-safety-layout-stable.png`
**Açıklama:** Running/Control sayfası, 2 dakika sonra, satırlar sabit

### Connection Health Tutarlılığı
**Dosya:** `evidence/local/hydration-safety-connection-health.png`
**Açıklama:** Settings Connection Health + Status Bar, aynı durumlar

---

## 🎯 RELEASE GATE EVIDENCE LINKLERİ

Bu kanıt paketi Release Gate altında "evidence" linklerine eklenebilir:

```
Release Gate Evidence:
- Hydration Safety: evidence/local/hydration-safety-console-clean.png
- Layout Stability: evidence/local/hydration-safety-layout-stable.png
- Connection Health: evidence/local/hydration-safety-connection-health.png
```

---

## ✅ FINAL CHECKLIST

- [ ] Hydration warning = 0 (tüm kritik sayfalar)
- [ ] Layout shift yok (relative time akarken)
- [ ] Dil tutarlılığı (`sn` / `dk` / `sa` / `gün`)
- [ ] Tooltip datetime doğru
- [ ] Connection Health tutarlı (Settings + Status Bar)
- [ ] min-width bağlamsal (8ch default, 10ch table rows)
- [ ] Global ticker throttle çalışıyor (tab hidden → 0.2Hz)

---

## 📚 REFERANSLAR

- `apps/web-next/src/components/common/ClientTime.tsx` - SSR-safe time component
- `apps/web-next/src/hooks/useGlobalTicker.ts` - Global ticker (visibility throttle)
- `apps/web-next/src/components/settings/ConnectionHealthCard.tsx` - Single source of truth
- `apps/web-next/tests/e2e/hydration.spec.ts` - E2E test

