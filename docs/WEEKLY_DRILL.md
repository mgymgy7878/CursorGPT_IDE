# Haftalık Mini-Tatbikat (≤10 dk)

## Amaç
Rollback kas hafızası + sinyal okur yazarlığı.

## Akış (Toplam ≤10 dk)
1) 60sn: `release:rollback <tag>` DRY-RUN (kanıt: timestamp log, önce/sonra sürüm)
2) 5dk: Sinyal turu (p95, 5xx, WS staleness, WS reconnect, CPU, mem, RPS, error budget)
3) 2dk: IC mikro-debrief (tek öğrenim, tek kalıcı iyileştirme)

## PASS Ölçütü
- Rollback komutu çalıştı ve kanıt dosyası üretildi.
- En az 6/8 sinyal sözlü olarak doğru yorumlandı.

