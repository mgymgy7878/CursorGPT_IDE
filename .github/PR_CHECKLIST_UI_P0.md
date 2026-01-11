# PR Checklist - UI-P0 İşleri İçin

Bu checklist, UI-P0 işleri için PR açarken kontrol edilmesi gereken tüm maddeleri içerir.

---

## ✅ Pre-PR Kontrolleri

### Kod Kalitesi
- [ ] `pnpm typecheck` - TypeScript hata yok
- [ ] `pnpm lint` - Linter temiz
- [ ] `pnpm test` - Unit testler geçti (varsa)
- [ ] `pnpm test:e2e` - E2E testler geçti

### Manuel Test
- [ ] Loading state görünüyor (skeleton)
- [ ] Empty state görünüyor (boş durum)
- [ ] Error state görünüyor (hata durumu)
- [ ] Klavye navigasyonu çalışıyor (Tab)
- [ ] Focus ring görünür
- [ ] Butonlar min 44×44px

### Lighthouse & Axe
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Axe Critical violations = 0
- [ ] Screenshot'lar alındı

---

## 📝 PR Hazırlığı

### Git İşlemleri
```bash
# Değişiklikleri kontrol et
git status
git diff

# Commit
git add .
git commit -m "UI-P0-XXX: [Sayfa Adı] skeleton & empty/error states

- Skeleton component eklendi
- Empty state component eklendi
- Error state component eklendi
- State yönetimi eklendi
- A11y iyileştirmeleri

Closes #<issue-num>"

# Push
git push -u origin ui-ux/ui-p0-xxx-[sayfa-adı]-skeleton
```

### PR Başlığı
```
UI-P0-XXX: [Sayfa Adı] skeleton & empty/error states
```

### PR Body
- [ ] `.github/PULL_REQUEST_TEMPLATE_UI_P0_001.md` şablonunu kullan
- [ ] Tüm alanları doldur
- [ ] UI/UX Talimatları uyumu bölümünü kontrol et
- [ ] Test sonuçlarını ekle

### Evidence
- [ ] Before screenshot (mevcut durum)
- [ ] After - Loading screenshot (skeleton)
- [ ] After - Empty screenshot (boş durum)
- [ ] After - Error screenshot (hata durumu)
- [ ] Lighthouse raporu screenshot
- [ ] Axe sonucu screenshot veya metin

### Issue Bağlantısı
- [ ] PR body'de `Closes #<issue-num>` var
- [ ] Issue label'ları doğru (`ui-ux`, `ui-ux:p0`, `area:*`)
- [ ] Epic'te checklist güncellenecek (PR merge sonrası)

---

## 🔍 Review Beklentileri

Reviewer şu soruları soracak:

- [ ] "Boş durumda ne oluyor?" → Boş durum ekranı var
- [ ] "Skeleton var mı?" → Skeleton state var
- [ ] "Klavye ile ulaşılabiliyor mu?" → Tab navigation çalışıyor
- [ ] "Lighthouse Accessibility ≥ 90 mı?" → Evet
- [ ] "Ekran görüntüsü/gif var mı?" → Var
- [ ] "UI/UX talimatlarına uygun mu?" → Evet

---

## ✅ Definition of Done

PR merge edilebilir:

- [x] Tüm pre-PR kontrolleri geçti
- [x] PR template dolduruldu
- [x] Evidence eklendi
- [x] Code review tamamlandı
- [x] Tüm testler geçti
- [x] Lighthouse/Axe hedefleri karşılandı
- [x] Issue kapatılacak (PR merge ile)

---

**Son Güncelleme:** 26.11.2025

