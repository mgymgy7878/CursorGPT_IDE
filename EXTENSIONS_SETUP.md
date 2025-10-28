# Cursor Extensions Kurulum Rehberi

## Durum

✅ **Kurulu:**

- Prisma
- ESLint
- Tailwind CSS IntelliSense
- DotENV

❌ **Eksik (Kurulması Gerekenler):**

- Prettier - Code formatter
- YAML (Red Hat)

## Manuel Kurulum Adımları

### 1. Prettier Kurulumu

1. Cursor'da `Ctrl+Shift+X` tuşlarına basarak Extensions paneline gidin
2. Arama çubuğuna "**Prettier - Code formatter**" yazın
3. **esbenp.prettier-vscode** (Prettier) extension'ını bulun
4. **Install** butonuna tıklayın

### 2. YAML Kurulumu

1. Arama çubuğuna "**YAML**" yazın
2. **YAML** extension'ını bulun (Red Hat tarafından)
3. **Install** butonuna tıklayın

## Alternatif: VS Code Marketplace'den Kurulum

### Prettier:

Marketplace Link: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode

### YAML:

Marketplace Link: https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml

## Kurulum Sonrası Yapılacaklar

### Prettier için:

1. `Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"
2. Şu ayarları ekleyin:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### YAML için:

- `.github/workflows/*.yml` dosyaları otomatik olarak YAML desteği ile açılacak
- CI/CD workflow dosyaları için syntax highlight ve validation aktif olacak

## Doğrulama

Kurulum sonrası aşağıdaki komutla extension'ları kontrol edin:

```powershell
code --list-extensions
```

**Beklenen Extension ID'ler:**

- esbenp.prettier-vscode ✅
- redhat.vscode-yaml ✅
- dbaeumer.vscode-eslint ✅
- bradlc.vscode-tailwindcss ✅
- prisma.prisma ✅
- mikestead.dotenv ✅

## Faydaları

**Prettier:**

- Tüm dosyalarda tutarlı kod formatlaması
- Save yaptığınızda otomatik format
- JSON, TypeScript, JavaScript dosyaları için özellikle önemli

**YAML:**

- GitHub Actions workflow dosyaları için syntax highlighting
- YAML hatalarını real-time tespit
- `.github/workflows/*.yml` dosyalarında Intellisense desteği
