# P0 Trigger Scripts

Bu komut dosyaları, P0 CI workflow'unu tetiklemek, koşumu izlemek, kanıt paketini indirmek ve FINAL SUMMARY'yi yazdırmak için hazırlanmıştır.

## Kullanım

- Mevcut konsolda (önerilen):

```
powershell -ExecutionPolicy Bypass -File .\scripts\p0_trigger.ps1
```

- Çift tıklayarak (pencere açık kalır):

```
.\scripts\p0_trigger.cmd
```

## Parametreler (opsiyonel)
- `-Repo` (varsayılan: `mgymgy7878/CursorGPT_IDE`)
- `-Workflow` (varsayılan: `p0-chain.yml`)
- `-ArtifactName` (varsayılan: `p0-artifacts`)
- `-NoPause` (prompt bekletmeyi kapatır)

## Akış
1. `gh auth status` kontrolü; gerekirse `gh auth login`
2. `gh workflow run <workflow>` tetikleme
3. `gh run list` ile son çalışmanın ID'sini bulma
4. `gh run watch <RUN_ID>` ile tamamlanana kadar izleme
5. `gh run download <RUN_ID> -n <artifact>` ile kanıt paketini indirme (`evidence/` klasörü)
6. `evidence/final_summary.txt` ilk satırı yazdırma

> Not: GitHub CLI kurulu olmalıdır: https://cli.github.com/manual/gh

