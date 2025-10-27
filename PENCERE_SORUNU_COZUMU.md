# PENCERE AÇILMA SORUNU - ÇÖZÜM

**Tarih**: 10 Ekim 2025  
**Durum**: ✅ ÇÖZÜLDÜ  
**Hazırlayan**: cursor (Claude 3.5 Sonnet)

---

## 🔴 SORUN

`basla.ps1` çalıştırıldığında **PM2 bir console penceresi açıyordu**.

---

## ✅ ÇÖZÜM

### Değişiklik: `ecosystem.config.cjs`

```javascript
// ÖNCESİ:
windowsHide: false  ❌

// SONRASI:
windowsHide: true   ✅
```

### Açıklama

- **`windowsHide: false`**: PM2 her uygulama için ayrı bir console penceresi açar
- **`windowsHide: true`**: PM2 arka planda çalışır, pencere açmaz

---

## 🧪 TEST

```powershell
# Eski servisleri durdur
pm2 delete all

# Yeni config ile başlat
pm2 start ecosystem.config.cjs

# Sonuç: ✅ Artık pencere açılmıyor!
```

---

## 📋 KULLANIM

### Servisleri Başlat (Pencere Açmaz)
```powershell
.\basla.ps1
```

### PM2 Loglarını İzle (İsteğe Bağlı)
```powershell
pm2 logs
```

### Servisleri Durdur
```powershell
.\durdur.ps1
```

---

## ✅ SONUÇ

**Artık hiçbir ek pencere açılmıyor!**

- ✅ PM2 arka planda çalışıyor
- ✅ Loglar `pm2 logs` ile görülebilir
- ✅ Temiz masaüstü deneyimi

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

