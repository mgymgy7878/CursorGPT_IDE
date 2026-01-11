# Full Mühür Ritüeli - Deterministik Süreç

**Amaç:** Release kapısından geçiş için 10 dakikalık deterministik verification süreci.

**Gereksinim:** PowerShell 7+ (pwsh)

---

## 🔄 Adım 0: Dev Stack Kontrolü

```powershell
# Dev stack'i başlat (en azından web + postgres)
.\scripts\dev-stack.ps1
```

**Beklenen:**
- ✅ PostgreSQL: `healthy` (docker compose ps postgres)
- ✅ Web (3003): Ayakta

---

## ✅ Adım 1: Pozitif Paket (Release-Grade)

```powershell
pnpm verify:ci:full
```

**Beklenen:**
- ✅ Type check geçti
- ✅ Executor healthy kontrolü geçti (SkipExecutorCheck OLMADAN)
- ✅ Kanıt klasörü: `evidence/final_verification_YYYY_MM_DD_HH_MM_SS/`
- ✅ Altın sinyaller: healthy + db:connected + verified:true

**Süre:** ~2-3 dakika

---

## ✅ Adım 2: Negatif Paket (Degradation Senaryoları)

```powershell
pnpm verify:negative
```

**Beklenen:**
- ✅ DB down senaryosu test edildi
- ✅ Executor down senaryosu test edildi (veya not edildi)
- ✅ Kanıt klasörü: `evidence/negative_tests_YYYY_MM_DD_HH_MM_SS/`

**Süre:** ~1-2 dakika

**Not:** En son oluşturulan klasörü bulmak için:
```powershell
Get-ChildItem evidence -Directory | Where-Object { $_.Name -match '^negative_tests_' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

---

## 📋 Adım 3: Evidence Index Güncelleme

**Dosya:** `docs/ops/FINAL_EVIDENCE_INDEX.md`

**Güncelleme:**
- Negatif paket klasör adını ekle (eğer gerçek klasör oluşturulduysa)
- Veya format bilgisini koru: `evidence/negative_tests_YYYY_MM_DD_HH_MM_SS/`

---

## 👁️ Adım 4: UI Hızlı Tur (30 Saniye)

**Dosya:** `docs/ops/UI_MANUAL_CHECKLIST_FINAL.md`

**Kontroller:**
1. ✅ Settings > Connection Health (yeşil/amber/kırmızı durumlar net)
2. ✅ Control > Audit tab: Integrity badge + Export butonu
3. ✅ /audit/all: pagination + tek scroll (terminal density)

**Süre:** ~30 saniye

---

## ✅ Mühür Kapanış Checklist

- [ ] Pozitif paket toplandı: `evidence/final_verification_YYYY_MM_DD_HH_MM_SS/`
- [ ] Negatif paket toplandı: `evidence/negative_tests_YYYY_MM_DD_HH_MM_SS/`
- [ ] Evidence Index güncellendi: Pozitif + negatif paketler listelenmiş
- [ ] UI manual checklist: 30 saniyelik tur tamamlandı
- [ ] PowerShell 7+ version guard: Aktif
- [ ] Encoding disiplini: Set-Content utf8
- [ ] CI verification kuralları: verify:ci ve verify:ci:full

---

## 🎯 Git Ritüeli

```bash
git add .
git commit -m "feat: P0-P8 completion - production ready milestone

Final mühür (4 ayak):
- ✅ Pozitif kanıt paketi (Executor healthy)
- ✅ Negatif kanıt paketi (degradation senaryoları)
- ✅ UI manual checklist (30 saniyelik tur)
- ✅ Evidence index güncel

CI/CD:
- ✅ verify:ci (PR/Her commit)
- ✅ verify:ci:full (Release tag/RC öncesi)
- ✅ Encoding disiplini (Set-Content utf8)
- ✅ PowerShell 7+ version guard

Breaking: None (backward compatible)

Closes: P0-P8 milestone"

git tag -a v0.8.0-production-ready -m "Production ready milestone (P0-P8)"
```

---

## 🎉 Sonuç

**"Kanıt üretiyor mu?" sorusunun cevabı tamamen dosya/folder isimleriyle mühürlenmiş:**

- ✅ Pozitif paket: `evidence/final_verification_YYYY_MM_DD_HH_MM_SS/`
- ✅ Negatif paket: `evidence/negative_tests_YYYY_MM_DD_HH_MM_SS/`
- ✅ UI checklist: `docs/ops/UI_MANUAL_CHECKLIST_FINAL.md`
- ✅ Evidence index: `docs/ops/FINAL_EVIDENCE_INDEX.md`

**Final mühür, kozmik ölçekte bile düzgün: hem deterministik hem de acımasızca kanıtlı.** 🚀

---

**Toplam Süre:** ~10 dakika (script'ler + UI tur + dokümantasyon güncelleme)

