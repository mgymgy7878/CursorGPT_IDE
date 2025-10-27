# Cursor Settings Checklist - Spark Profile

## Auto-Run Mode Ayarları

### Seçim: Use Allowlist
- ✅ **Use Allowlist** seçili olmalı
- ❌ "Run Everything" riskli - kullanma
- ❌ "Ask Every Time" çok frenli - kullanma

**Sebep**: Yalnız beyaz listedekileri otomatik çalıştır, diğerlerinde sor

## Command Allowlist (Tam Liste)

Aşağıdaki komutları **tek tek** ekle, başka hiçbir şeyi açma:

### Node.js & Package Management
- `node`
- `pnpm`
- `pnpm run` 
- `pnpm --filter`
- `pnpm -w`
- `tsc`
- `npx`

### HTTP & Network
- `curl`
- `Invoke-WebRequest`

### File Operations (Kontrollü)
- `mkdir`
- `Move-Item`
- `rimraf`

### Tanılama & Okuma
- `Get-ChildItem`
- `Get-Content`
- `type`
- `Start-Sleep`
- `netstat`
- `findstr`
- `taskkill`
- `cd`

## Güvenlik Mantığı

### ✅ İzin Verilenler
- **Yazma/silme kontrollü**: rimraf var, ama Remove-Item/del/rmdir yok → kazara dosya silme koruması
- **Tanılama yeterli**: süreç/port kontrolü, dizin/okuma, Node/pnpm işleri
- **HTTP testleri**: curl ve Invoke-WebRequest

### ❌ Yasak Olanlar
- **VCS/dağıtım**: git, docker*, pm2 (push/servis yasağı)
- **Registry/system**: reg*, sc*, schtasks (kalıcı değişim yasağı) 
- **PowerShell advance**: powershell -EncodedCommand (güvenlik)
- **Network config**: netsh, setx (sistem ayar değişimi yasağı)

## Diğer Ayarlar

### Background Agents
- ✅ **Kapalı** tut (Windows süreç bug'ları nedeniyle)

### MCP Tools  
- ✅ **Manuel** ayar - şimdilik ekleme

## Notlar

- `type` CMD içi komut; PowerShell'de karşılığı Get-Content
- `rimraf` proje bağımlılığı olarak bulunur; yoksa eklemeye gerek yok
- Çok temkinli modda kısa süreliğine "Ask Every Time" kullanılabilir (prod ortamında)
- Read-only git tanılama ihtiyacı çıkarsa git'i kapalı tutup alternatif komutlar öner

## Doğrulama

Ayarları uyguladıktan sonra `scripts\cursor-boot.cmd` çalıştır.
`evidence\cursor_boot\summary.txt` dosyası "profil tamam" satırlarını yazıyorsa ayarlar doğru.