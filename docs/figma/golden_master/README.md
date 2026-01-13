# Golden Master Screenshots

## Konsept

Figma'daki doğru ekranların PNG export'ları burada saklanır. Bu dosyalar "golden master" referansı olarak kullanılır.

## Kurulum

1. **Figma'dan PNG export'ları al:**
   - Dashboard
   - Market Data
   - Strategies
   - Running Strategies
   - Control Center
   - Settings
   - Command Palette (açık)

2. **Dosyaları bu klasöre koy:**
   ```
   docs/figma/golden_master/dashboard.png
   docs/figma/golden_master/market-data.png
   docs/figma/golden_master/strategies.png
   docs/figma/golden_master/running.png
   docs/figma/golden_master/control.png
   docs/figma/golden_master/settings.png
   docs/figma/golden_master/command-palette.png
   ```

3. **Golden master tag'le:**
   ```powershell
   git add docs/figma/golden_master/*.png
   git commit -m "docs: add golden master screenshots"
   git tag ui/golden-master/v1
   git push --tags
   ```

## Kullanım

### Büyük Kırılmada Golden Master'a Dön

```powershell
.\tools\windows\rollback.ps1 -Tag "ui/golden-master/v1"
```

### Visual Smoke Test ile Karşılaştırma

Golden master screenshot'ları visual smoke test baseline olarak kullanılabilir:

```powershell
# Visual smoke test golden master ile karşılaştır
pnpm ui:test:visual --baseline docs/figma/golden_master
```

## Versiyonlama

Golden master'ı güncellediğinde yeni versiyon tag'le:

```powershell
git tag ui/golden-master/v2
git push --tags
```

## Notlar

- Golden master = teknik referans + görsel referans
- Figma'daki doğru halin mühürü
- Büyük kırılmada buraya dönülebilir
- Visual smoke test baseline olarak kullanılabilir
