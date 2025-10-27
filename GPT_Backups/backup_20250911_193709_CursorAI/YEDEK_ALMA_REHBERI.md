# 🔄 Yedek Alma Sistemi Rehberi

## 📋 Hızlı Komutlar

### 1. Otomatik Yedek Alma
```bash
.\auto-backup.ps1
```

### 2. Hızlı Yedek Alma (Batch)
```bash
.\quick-backup.bat
```

### 3. Manuel Yedek Alma
```bash
git add .
git commit -m "Yedek mesajınız"
```

## 🔍 Yedekleri Görüntüleme

### Git Log'u Görüntüle
```bash
git log --oneline -10
```

### Son Commit'i Görüntüle
```bash
git show --name-only
```

## ⏪ Geri Dönme

### Son Commit'e Dön
```bash
git reset --hard HEAD
```

### Belirli Bir Commit'e Dön
```bash
git log --oneline  # Commit hash'ini bul
git checkout <commit-hash>
```

### Son 3 Commit'i Geri Al
```bash
git reset --hard HEAD~3
```

## 🚀 Kullanım Önerileri

### Her Değişiklikten Sonra:
1. `.\quick-backup.bat` çalıştırın
2. Veya `.\auto-backup.ps1` kullanın

### Önemli Değişiklikler İçin:
```bash
git add .
git commit -m "Önemli özellik: [açıklama]"
```

### Acil Durumlar İçin:
```bash
git reset --hard HEAD  # Son çalışan duruma dön
```

## 📁 Commit Geçmişi

- **c64deeb**: Profesyonel ana sayfa tasarımı tamamlandı
- **70aff55**: Proje tamamlandı - Çalışır durumda  
- **69637e5**: Gitignore eklendi

## ⚠️ Önemli Notlar

1. **Her değişiklikten sonra yedek alın!**
2. **Önemli commit'ler için açıklayıcı mesajlar yazın**
3. **Sorun yaşarsanız `git reset --hard HEAD` ile geri dönün**
4. **Yedek dosyaları `.gitignore`'da tutun**

## 🎯 Hızlı Başlangıç

1. Değişiklik yapın
2. `.\quick-backup.bat` çalıştırın
3. Yedek alındı! ✅

---
**Artık güvenle çalışabilirsiniz!** 🚀 