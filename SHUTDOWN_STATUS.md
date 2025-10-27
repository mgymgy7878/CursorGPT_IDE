# BILGISAYAR YENIDEN BAŞLATMA ÖNCESI DURUM RAPORU
Tarih: 2025-09-21 02:27:08

## MEVCUT SERVİSLER
- PM2 spark-web: Çalışıyor (PID: 5456)
- PM2 logrotate: Çalışıyor (PID: 4544)

## YEDEKLEME DURUMU
- En son yedekleme: critical_backup_2025-09-20_19-05-07.zip
- Yedekleme boyutu: 0.17 MB
- Otomatik yedekleme: Tamamlandı

## YENİDEN BAŞLATMA SONRASI YAPILACAKLAR
1. PM2 servislerini yeniden başlat: pm2 restart all
2. Frontend kontrolü: http://localhost:3003
3. Backend kontrolü: http://localhost:4001
4. Sistem durumu: /ops endpoint kontrolü

## NOTLAR
- Tüm değişiklikler yedeklendi
- Servisler güvenli şekilde durdurulacak
- Yeniden başlatma sonrası otomatik başlatma için PM2 kullanılacak
