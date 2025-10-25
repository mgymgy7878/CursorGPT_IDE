# T+24h Micro Debrief - v1.4.0

**Date:** ___________  
**Release:** v1.4.0  
**Debrief Owner:** ___________

---

## 5-Maddelik Debrief Notu

### 1. En Yüksek SLO Sapması

**Sapma:**
- Metrik: ___________
- Beklenen: ___________
- Gerçekleşen: ___________
- Süre: ___________

**Neden:**
- Root cause: ___________
- Contributing factors: ___________

**Düzeltme:**
- Immediate fix: ___________
- Long-term prevention: ___________
- Owner: ___________
- ETA: ___________

---

### 2. Otomatik Tetik Analizi

**Uyarı veren tetikler:**
- [ ] Tetik 1: ___________ | Doğru/Yanlış pozitif | Açıklama: ___________
- [ ] Tetik 2: ___________ | Doğru/Yanlış pozitif | Açıklama: ___________
- [ ] Tetik 3: ___________ | Doğru/Yanlış pozitif | Açıklama: ___________

**Doğruluk oranı:** ___% (doğru uyarı / toplam uyarı)

**Aksiyon:**
- Eşik ayarı gerekli mi? ___________
- Yeni tetik eklenecek mi? ___________
- Kaldırılacak tetik var mı? ___________

---

### 3. Kanıt Dosyaları Eksiksizliği

**Beklenen:** 50+ evidence files  
**Gerçekleşen:** ___ files

**Eksik dosyalar (varsa):**
- [ ] ___________ | Sebep: ___________ | Aksiyon: ___________
- [ ] ___________ | Sebep: ___________ | Aksiyon: ___________

**Eksik adım/script:**
- Adım: ___________
- Fix: ___________
- Owner: ___________

---

### 4. Rollback Tatbikatı Sonucu

**Tatbikat tipi:** Soğuk / Ilık / Sıcak (birini seç)

**Sıcaklık tanımları:**
- **Soğuk:** Planlanmış drill, production traffic yok
- **Ilık:** Canary sırasında hold/rollback decision
- **Sıcak:** Production incident, actual rollback

**Süre:** ___ dakika (hedef: ≤5dk)

**Sonuç:**
- [ ] Başarılı (≤5dk, kanıt korundu)
- [ ] Kısmi (>5dk veya kanıt eksik)
- [ ] Başarısız (rollback tamamlanamadı)

**İyileştirme:**
- ___________ 
- ___________

---

### 5. Bir Cümlelik Geliştirme (v1.5 backlog)

**Geliştirme maddesi:**

> ___________________________________________________________________________

**Öncelik:** P0 / P1 / P2 (birini seç)

**Tahmini etki:** High / Medium / Low (birini seç)

**Owner:** ___________

---

## Quick Metrics Summary

**Canary Timeline:**
- Stage 1 (1%):   ___:___ | Karar: ___________
- Stage 2 (5%):   ___:___ | Karar: ___________
- Stage 3 (25%):  ___:___ | Karar: ___________
- Stage 4 (50%):  ___:___ | Karar: ___________
- Stage 5 (100%): ___:___ | Karar: ___________

**8 Golden Signals (avg over 24h):**
- API P95:      ___ ms (threshold: ≤200ms)
- 5xx rate:     ___% (threshold: ≤1%)
- WS staleness: ___ s (threshold: ≤30s)
- Risk blocks:  ___ /min (threshold: <0.5/min)
- Idempotency:  ___% (threshold: ≤1%)
- CSP:          ___% (threshold: ≤baseline+10%)
- Event-loop:   ___ ms (threshold: ≤50ms)
- GC pause:     ___ ms (threshold: ≤20ms)

**Pass/Fail:** ___ / 8 signals passed

---

## KANIT Mantra Check

- [x] **K**ontrol et (8 sinyal) → Monitored ✅
- [x] **A**nomiyi yakala (20 tetik) → Evaluated ✅
- [x] **N**ot düş (war-room satırı) → Logged ✅
- [x] **İ**lerle/İptal et (proceed/rollback) → Decided ✅
- [x] **T**anık bırak (kanıt dosyaları) → Archived ✅

---

## Sonuç

**Overall assessment:** Success / Partial / Failed (birini seç)

**Freeze lift:** Yes / No / Pending (birini seç)

**Signed:** ___________ (IC)  
**Date:** ___________

---

_Hipotez → Ölçüm → Kanıt → Zarif Geri Dönüş_ 🚀🔬💚

