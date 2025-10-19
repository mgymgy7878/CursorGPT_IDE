# 📚 SPARK TRADING PLATFORM - DÖKÜMAN İNDEKSİ

**Platform:** v2.0 ML Signal Fusion  
**Tarih:** 2025-10-14  
**Durum:** ✅ Production Ready

---

## 🚀 HIZLI BAŞLANGIÇ

### İlk Kez Mi?
1. **CUTOVER_CARD.txt** → Tek sayfa, kopyala-çalıştır
2. **FINAL_CHECKLIST.txt** → Yazdır, duvara as
3. `bash scripts/green-room-check.sh` → Test et

### Go-Live Günü?
1. **CUTOVER_CARD.txt** → Cebinde
2. **POCKET_CARD.md** → Ekranda
3. `bash scripts/flight-deck.sh` → Uçuş güvertesi

---

## 📋 DÖKÜMAN HİYERARŞİSİ

### Tier 1: Hızlı Referans (Tek Sayfa)
```
🎯 CUTOVER_CARD.txt        ← BURADAN BAŞLA
   → Tek sayfa, sıfır laf kalabalığı
   → Preflight, Canary, Panel, CLI, Refleks
   → Kopyala-çalıştır

📋 FINAL_CHECKLIST.txt     ← YAZDIR, AS
   → Checkbox'lar, adım adım
   → Duvara asmak için

🎯 POCKET_CARD.md          ← EKRANDA TUT
   → Detaylı versiyon
   → tmux, jq, mikro-ayar
```

### Tier 2: Playbook'lar (Full Detay)
```
📚 GO_LIVE_PLAYBOOK.md     ← FULL PLAYBOOK
   → 450+ satır
   → Her şey açıklamalı
   → Canary → %100 → Rollback

🚨 TRIAGE_MATRIX.md        ← ACİL DURUM
   → 400+ satır
   → 5 senaryo, refleks
   → Eskalasyon seviyeleri

🎭 GREEN_ROOM_SUMMARY.md   ← T-15 KONTROL
   → Green-room prosedür
   → Son dokunuş özeti
```

### Tier 3: Kalite & Test
```
✅ QUALITY_TURNSTILE_CHECKLIST.md  ← 10 DK KONTROL
   → Manuel test listesi
   → 10 kontrol noktası

✅ QUALITY_TURNSTILE_REPORT.md     ← SONUÇ RAPORU
   → Turnike geçiş raporu
   → Sonuçlar, metrikler

🔧 QA_HARDENING_COMPLETE.md        ← RÖTUŞLAR
   → 368 satır
   → 18 görev tamamlandı
```

### Tier 4: Özetler
```
📊 GO_LIVE_SUMMARY.md      ← GENEL ÖZET
   → Tüm döküman listesi
   → Hızlı başlangıç

📊 UI_ANALYSIS_REPORT.md   ← UI ANALİZİ
   → Layout, component
   → Tasarım sistemi
```

---

## 🛠️ SCRIPT'LER

### Otomasyon
```bash
# Preflight (T-15)
bash scripts/green-room-check.sh

# Canlı izleme
bash scripts/monitor-live.sh

# Preflight detaylı
bash scripts/preflight-check.sh

# Uçuş güvertesi (tmux)
bash scripts/flight-deck.sh

# Hızlı sorgular (jq)
bash scripts/quick-filters.sh [errors|bucket|confid|top-errors|kardinalite]
```

---

## 🎯 KULLANIM SENARYOLARI

### Senaryo 1: İlk Defa Go-Live
```
1. CUTOVER_CARD.txt oku (5 dk)
2. bash scripts/green-room-check.sh (2 dk)
3. CUTOVER_CARD.txt'deki adımları takip et
4. Sorun çıkarsa → TRIAGE_MATRIX.md
```

### Senaryo 2: Rutin Go-Live
```
1. CUTOVER_CARD.txt cebinde
2. bash scripts/flight-deck.sh
3. Panel 3+2 izle
4. Sorun → Ops Hızlı Yardım → Triage
```

### Senaryo 3: Acil Durum
```
1. UI → Ops Hızlı Yardım (🚑)
2. Triage Matrix aç
3. Belirti → Refleks → Kopyala-çalıştır
4. Monitor ile doğrula
```

### Senaryo 4: 24h Sonrası Rapor
```
1. GO_LIVE_PLAYBOOK.md → "24 SAATLİK RAPOR ŞABLONU"
2. Metrikleri doldur
3. Aksiyon belirle
4. Team'e sunumla
```

---

## 📂 DOSYA YAPISI

```
apps/web-next/
│
├── 🎯 Hızlı Referans (Tier 1)
│   ├── CUTOVER_CARD.txt ⭐⭐⭐
│   ├── FINAL_CHECKLIST.txt ⭐⭐⭐
│   └── POCKET_CARD.md ⭐⭐
│
├── 📚 Playbook'lar (Tier 2)
│   ├── GO_LIVE_PLAYBOOK.md ⭐⭐
│   ├── TRIAGE_MATRIX.md ⭐⭐
│   └── GREEN_ROOM_SUMMARY.md ⭐
│
├── ✅ Kalite & Test (Tier 3)
│   ├── QUALITY_TURNSTILE_CHECKLIST.md ⭐
│   ├── QUALITY_TURNSTILE_REPORT.md ⭐
│   └── QA_HARDENING_COMPLETE.md ⭐
│
├── 📊 Özetler (Tier 4)
│   ├── GO_LIVE_SUMMARY.md
│   ├── UI_ANALYSIS_REPORT.md
│   └── INDEX.md (Bu dosya)
│
├── 🛠️ Script'ler
│   ├── scripts/green-room-check.sh ⭐⭐⭐
│   ├── scripts/monitor-live.sh ⭐⭐⭐
│   ├── scripts/preflight-check.sh ⭐⭐
│   ├── scripts/flight-deck.sh ⭐⭐
│   └── scripts/quick-filters.sh ⭐
│
└── ⚙️ Config
    ├── .env.example
    ├── GO_LIVE_CHECKLIST.txt
    └── tsconfig.json

⭐⭐⭐ = Must-have (Olmazsa olmaz)
⭐⭐   = Recommended (Şiddetle tavsiye)
⭐     = Optional (İsteğe bağlı)
```

---

## 🎓 ÖĞRENME YOLU

### Yeni Başlayanlar (First Timer)
```
1. CUTOVER_CARD.txt (5 dk)
2. FINAL_CHECKLIST.txt (2 dk)
3. GO_LIVE_PLAYBOOK.md (30 dk)
4. scripts/green-room-check.sh çalıştır
5. scripts/flight-deck.sh dene
```

### Deneyimli (Experienced)
```
1. CUTOVER_CARD.txt (2 dk)
2. scripts/flight-deck.sh
3. Sorun → TRIAGE_MATRIX.md
```

### Uzman (Expert)
```
1. CUTOVER_CARD.txt cebinde
2. Refleksler ezberinde
3. Ops Hızlı Yardım her an hazır
```

---

## 🚨 ACİL DURUM KILAVUZU

### Kırmızı Alarm
```
1. UI → 🚑 Ops Hızlı Yardım
2. Triage Matrix → Senaryo seç
3. Refleks → Kopyala-çalıştır
4. Rollback gerekirse:
   FEATURE_ML_SCORING=0 ./deploy.sh --rollback
```

### Sarı Uyarı
```
1. TRIAGE_MATRIX.md → Warning level
2. Preview mode + adjust
3. 15-30 dk izle
4. Yeşile dönerse devam
```

---

## 📞 DESTEK KAYNAKLARI

### Dökümanlar
- **Hızlı:** CUTOVER_CARD.txt
- **Detay:** GO_LIVE_PLAYBOOK.md
- **Acil:** TRIAGE_MATRIX.md

### Script'ler
- **Test:** `bash scripts/green-room-check.sh`
- **İzle:** `bash scripts/monitor-live.sh`
- **Sorgu:** `bash scripts/quick-filters.sh`

### UI
- **Ops:** PageHeader → 🚑 Ops Hızlı Yardım
- **SHA:** Footer → Build SHA (copy)
- **Playbook:** Dropdown → Linkler

---

## 🎯 HEDEF KİTLE

| Rol | Başlangıç | Referans | Acil |
|-----|-----------|----------|------|
| **DevOps** | CUTOVER_CARD | GO_LIVE_PLAYBOOK | TRIAGE_MATRIX |
| **SRE** | CUTOVER_CARD | monitor-live.sh | TRIAGE_MATRIX |
| **Developer** | POCKET_CARD | QA_HARDENING | Ops Hızlı Yardım |
| **PM** | FINAL_CHECKLIST | GO_LIVE_SUMMARY | - |
| **QA** | QUALITY_TURNSTILE | QA_HARDENING | - |

---

## 🎵 RİTİM

```
Bas → Ölç → Kapat (gerekirse) → Nefes al → Tekrar aç
Tempo: 60 BPM
Fail-closed: Hep hazır
Sinyal net → Genişlet
Gürültü → Kapat
```

---

## ✅ KONTROL LİSTESİ

### Döküman Hazırlığı
- [x] CUTOVER_CARD.txt hazır
- [x] FINAL_CHECKLIST.txt hazır
- [x] GO_LIVE_PLAYBOOK.md hazır
- [x] TRIAGE_MATRIX.md hazır
- [x] Script'ler executable
- [x] INDEX.md (bu dosya)

### Go-Live Hazırlığı
- [ ] CUTOVER_CARD.txt yazdırıldı
- [ ] FINAL_CHECKLIST.txt duvara asıldı
- [ ] Script'ler test edildi
- [ ] UI: Ops Hızlı Yardım çalışıyor
- [ ] Team bilgilendirildi

---

## 🎬 ŞİMDİ MÜZİK!

**Baton sende.**  
**Döküman tam.**  
**Script'ler hazır.**  
**Refleksler keskin.**  
**Tempo 60 BPM.**

**🎯 CUTOVER_CARD.txt → BURADAN BAŞLA!**

---

**INDEX SONU**

