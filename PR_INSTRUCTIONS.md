# GitHub PR ve Workflow Tetikleme Rehberi

## Durum
✅ Git geçmişi temizlendi (büyük dosyalar kaldırıldı)
✅ Branch `docs/v1.0-cleanup` remote'a push edildi
✅ Workflow dosyası mevcut: `.github/workflows/p0-chain.yml`

## Adım 1: GitHub'da Workflow'u Tetikleme

### Web Tarayıcı ile (En Kolay):

1. **GitHub'a git**: https://github.com/mgymgy7878/CursorGPT_IDE

2. **Actions sekmesine tıkla** (üst menüde)

3. **Sol taraftan "P0 Chain" workflow'unu seç**

4. **"Run workflow" butonuna tıkla** (sağ üstte)

5. **Branch seç**: `docs/v1.0-cleanup`

6. **Yeşil "Run workflow" butonuna tıkla**

7. **Workflow çalışmasını izle**: Sarı nokta (çalışıyor), yeşil tick (başarılı)

### Sonuç Görme:

1. **Workflow tamamlandığında**:
   - Workflow adına tıkla
   - Aşağı kaydır
   - "Artifacts" bölümünde **"p0-artifacts"** indir
   - ZIP'i aç ve `final_summary.txt` dosyasını oku

## Adım 2: PR Oluşturma (Opsiyonel)

Eğer `docs/v1.0-cleanup` branch'ini başka bir branch'e merge etmek istersen:

### Web Tarayıcı ile:

1. **Pull requests sekmesine tıkla**

2. **"New pull request" butonuna tıkla**

3. **Base branch** seç (örn: `main` veya istediğin branch)

4. **Compare branch**: `docs/v1.0-cleanup`

5. **Başlık yaz**: "repo: history cleanup"

6. **Açıklama yaz**: "Remove large files from git history and extend .gitignore"

7. **"Create pull request" butonuna tıkla**

8. **PR'ı merge et**: "Squash and merge" seçeneğini kullan

### GitHub CLI ile (Alternatif):

```powershell
# PR oluştur (örnek: main branch'ine)
gh pr create -B main -H docs/v1.0-cleanup -t "repo: history cleanup" -b "Remove large files from git history"

# PR'ı merge et
gh pr merge --squash --auto
```

## Şu Anki Durum

- **Default branch**: `docs/v1.0-cleanup`
- **Git history**: Temiz (100MB+ dosyalar kaldırıldı)
- **Workflow**: Web UI'den manuel tetiklenebilir

## Not

Workflow'u tetiklemek için GitHub hesabınızla giriş yapmanız gerekir.
Repository: https://github.com/mgymgy7878/CursorGPT_IDE

