# 🤖 SPARK TRADING PLATFORM - AI AJANLAR MİMARİSİ VE İNTENTLER

**Tarih:** 29 Ocak 2025
**Analiz Eden:** ChatGPT + Cursor (Claude 4.1 Opus)
**Versiyon:** v1.3.2-SNAPSHOT
**Durum:** 🟢 2-Ajanlı Mimari Tasarımı

---

## 🎯 EXECUTIVE SUMMARY

Spark Trading Platform'un benzersiz değer önerisi olan **2-ajanlı mimari** detaylandırılmıştır. Strateji Copilot ve Süpervizör Copilot'ın intent'leri, etkileşimleri ve UI/desktop'ta görünecek sinyaller tanımlanmıştır.

---

## 🏗️ 2-AJANLI MİMARİ GENEL BAKIŞ

### Ajan 1: Strateji Copilot
**Rol:** Strateji üretimi, optimizasyon ve kullanıcı etkileşimi
**Hedef:** Kullanıcıdan gereksinimleri toplar, strateji üretir, test eder

### Ajan 2: Süpervizör Copilot
**Rol:** Piyasa izleme, strateji seçimi, risk yönetimi
**Hedef:** Piyasayı analiz eder, hangi stratejinin çalışacağına karar verir

---

## 🧠 STRATEJİ COPILOT INTENTLERİ

### 1. Strateji Üretimi Intentleri

#### `strategy.generate`
**Açıklama:** Kullanıcı gereksinimlerinden strateji üretir
**Input:** Kullanıcı prompt'u, piyasa tercihleri, risk profili
**Output:** Pine Script/MQL5 kodu, strateji açıklaması
**UI Sinyali:** "Strateji üretiliyor..." → "Strateji hazır"

#### `strategy.optimize`
**Açıklama:** Mevcut stratejiyi optimize eder
**Input:** Strateji kodu, optimizasyon parametreleri
**Output:** Optimize edilmiş strateji, performans metrikleri
**UI Sinyali:** "Optimizasyon çalışıyor..." → "Optimizasyon tamamlandı"

#### `strategy.validate`
**Açıklama:** Strateji kodunu doğrular
**Input:** Strateji kodu
**Output:** Doğrulama sonucu, hata mesajları
**UI Sinyali:** "Kod kontrol ediliyor..." → "Kod geçerli/Geçersiz"

### 2. Teknik Analiz Intentleri

#### `analysis.fibonacci`
**Açıklama:** Fibonacci seviyelerini hesaplar
**Input:** Yüksek/düşük fiyatlar, sembol
**Output:** Fibonacci seviyeleri, destek/direnç noktaları
**UI Sinyali:** Grafik üzerinde Fibonacci çizgileri

#### `analysis.bollinger`
**Açıklama:** Bollinger Bands hesaplar
**Input:** Fiyat verisi, periyot, standart sapma
**Output:** Üst/orta/alt bantlar, sinyal noktaları
**UI Sinyali:** Grafik üzerinde Bollinger Bands

#### `analysis.macd`
**Açıklama:** MACD göstergesini hesaplar
**Input:** Fiyat verisi, hızlı/yavaş EMA
**Output:** MACD çizgisi, sinyal çizgisi, histogram
**UI Sinyali:** Alt panelde MACD göstergesi

#### `analysis.stochastic`
**Açıklama:** Stochastic göstergesini hesaplar
**Input:** Fiyat verisi, K/D periyotları
**Output:** %K ve %D değerleri, aşırı alım/satım seviyeleri
**UI Sinyali:** Alt panelde Stochastic göstergesi

### 3. Strateji Yönetimi Intentleri

#### `strategy.template.store`
**Açıklama:** Hazır strateji şablonlarını listeler
**Input:** Kategori, zorluk seviyesi
**Output:** Şablon listesi, açıklamalar
**UI Sinyali:** Şablon galerisi görünümü

#### `strategy.mutate`
**Açıklama:** Mevcut stratejiyi varyasyonlar oluşturur
**Input:** Ana strateji, mutasyon parametreleri
**Output:** 4-5 varyant strateji
**UI Sinyali:** "Varyasyonlar oluşturuluyor..." → "4 varyant hazır"

#### `strategy.family`
**Açıklama:** Aynı stratejiyi farklı sembol/timeframe'lerde çalıştırır
**Input:** Ana strateji, sembol listesi, timeframe listesi
**Output:** Çoklu senaryo stratejileri
**UI Sinyali:** "Çoklu senaryo oluşturuluyor..." → "Senaryolar hazır"

---

## 👁️ SÜPERVİZÖR COPILOT INTENTLERİ

### 1. Piyasa Analizi Intentleri

#### `market.regime.detect`
**Açıklama:** Piyasa rejimini tespit eder
**Input:** Fiyat verisi, volatilite, hacim
**Output:** Trend/Range/High-Vol/Low-Liquidity
**UI Sinyali:** Piyasa rejim göstergesi (renk kodlu)

#### `market.health.check`
**Açıklama:** Borsa sağlık durumunu kontrol eder
**Input:** Borsa API'leri, latency, hata oranları
**Output:** Sağlık skoru, uyarılar
**UI Sinyali:** Borsa durumu göstergesi (yeşil/sarı/kırmızı)

#### `market.opportunity.scan`
**Açıklama:** Piyasada fırsatları tarar
**Input:** Aktif stratejiler, piyasa verisi
**Output:** Fırsat listesi, öncelik sırası
**UI Sinyali:** "Yeni fırsat bulundu" bildirimi

### 2. Strateji Yönetimi Intentleri

#### `strategy.select`
**Açıklama:** Çalışacak stratejiyi seçer
**Input:** Aktif stratejiler, piyasa durumu, risk profili
**Output:** Seçilen strateji, gerekçe
**UI Sinyali:** "Strateji seçildi: [isim]" + gerekçe

#### `strategy.pause`
**Açıklama:** Stratejiyi geçici olarak durdurur
**Input:** Strateji ID, durdurma sebebi
**Output:** Durdurma onayı, log kaydı
**UI Sinyali:** "Strateji durduruldu: [sebep]"

#### `strategy.resume`
**Açıklama:** Durdurulan stratejiyi yeniden başlatır
**Input:** Strateji ID, başlatma sebebi
**Output:** Başlatma onayı, log kaydı
**UI Sinyali:** "Strateji yeniden başlatıldı"

#### `strategy.stop`
**Açıklama:** Stratejiyi tamamen durdurur
**Input:** Strateji ID, durdurma sebebi
**Output:** Durdurma onayı, pozisyon kapatma
**UI Sinyali:** "Strateji durduruldu ve pozisyonlar kapatıldı"

### 3. Risk Yönetimi Intentleri

#### `risk.position.check`
**Açıklama:** Açık pozisyonları kontrol eder
**Input:** Pozisyon listesi, risk limitleri
**Output:** Risk değerlendirmesi, uyarılar
**UI Sinyali:** Risk göstergesi (yeşil/sarı/kırmızı)

#### `risk.limit.enforce`
**Açıklama:** Risk limitlerini uygular
**Input:** Risk limitleri, mevcut pozisyonlar
**Output:** Limit aşımı uyarısı, otomatik kapatma
**UI Sinyali:** "Risk limiti aşıldı, pozisyon kapatılıyor"

#### `risk.daily.check`
**Açıklama:** Günlük risk durumunu kontrol eder
**Input:** Günlük P&L, risk limitleri
**Output:** Günlük risk değerlendirmesi
**UI Sinyali:** Günlük risk raporu

### 4. Acil Durum Intentleri

#### `emergency.kill.switch`
**Açıklama:** Tüm stratejileri acil durdurur
**Input:** Acil durum sinyali
**Output:** Tüm stratejiler durduruldu, pozisyonlar kapatıldı
**UI Sinyali:** "ACİL DURDURMA AKTİF" (kırmızı uyarı)

#### `emergency.position.close`
**Açıklama:** Tüm pozisyonları acil kapatır
**Input:** Acil durum sinyali
**Output:** Tüm pozisyonlar kapatıldı
**UI Sinyali:** "TÜM POZİSYONLAR KAPATILDI"

---

## 🖥️ UI/DESKTOP'TA GÖRÜNECEK SİNYALLER

### 1. Dashboard Sinyalleri

#### Strateji Copilot Sinyalleri
- **"Strateji Üretiliyor..."** → Progress bar + spinner
- **"Strateji Hazır"** → Yeşil onay + strateji özeti
- **"Optimizasyon Tamamlandı"** → Performans metrikleri + grafik
- **"Kod Geçersiz"** → Kırmızı uyarı + hata detayları

#### Süpervizör Copilot Sinyalleri
- **"Piyasa Rejimi: [Trend/Range]"** → Renk kodlu göstergeler
- **"Borsa Durumu: [Sağlıklı/Uyarı/Kritik]"** → Durum göstergeleri
- **"Yeni Fırsat Bulundu"** → Bildirim + fırsat detayları
- **"Strateji Seçildi: [İsim]"** → Seçilen strateji + gerekçe

### 2. Risk Yönetimi Sinyalleri

#### Risk Durumu
- **"Risk: Düşük"** → Yeşil göstergeler
- **"Risk: Orta"** → Sarı göstergeler
- **"Risk: Yüksek"** → Kırmızı göstergeler
- **"Risk Limiti Aşıldı"** → Kırmızı uyarı + otomatik aksiyon

#### Acil Durum Sinyalleri
- **"ACİL DURDURMA AKTİF"** → Kırmızı banner + ses uyarısı
- **"TÜM POZİSYONLAR KAPATILDI"** → Onay mesajı + log

### 3. Grafik Sinyalleri

#### Teknik Analiz
- **Fibonacci Seviyeleri** → Grafik üzerinde çizgiler
- **Bollinger Bands** → Grafik üzerinde bantlar
- **MACD** → Alt panelde göstergeler
- **Stochastic** → Alt panelde göstergeler

#### Strateji Sinyalleri
- **"Strateji Açılış Sinyali"** → Grafik üzerinde ok
- **"Strateji Kapanış Sinyali"** → Grafik üzerinde ok
- **"Stop Loss Tetiklendi"** → Kırmızı çizgi + uyarı

---

## 🔄 AJANLAR ARASI ETKİLEŞİM

### 1. Strateji Copilot → Süpervizör Copilot
- **Strateji Üretildi** → Süpervizör'e bildirim
- **Strateji Test Edildi** → Performans verisi gönderimi
- **Strateji Optimize Edildi** → Yeni parametreler gönderimi

### 2. Süpervizör Copilot → Strateji Copilot
- **Piyasa Durumu Değişti** → Strateji güncelleme talebi
- **Risk Limiti Aşıldı** → Strateji durdurma talebi
- **Yeni Fırsat Bulundu** → Strateji üretim talebi

### 3. Ortak Veri Paylaşımı
- **Market Data** → Her iki ajan da kullanır
- **Risk Profili** → Her iki ajan da uygular
- **Strateji Durumu** → Her iki ajan da takip eder

---

## 📊 INTENT PERFORMANS METRİKLERİ

### Strateji Copilot Metrikleri
- **Strateji Üretim Süresi:** <30 saniye
- **Optimizasyon Süresi:** <5 dakika
- **Kod Doğrulama Süresi:** <10 saniye
- **Başarı Oranı:** >%90

### Süpervizör Copilot Metrikleri
- **Piyasa Analiz Süresi:** <5 saniye
- **Strateji Seçim Süresi:** <10 saniye
- **Risk Kontrol Süresi:** <3 saniye
- **Acil Durum Yanıt Süresi:** <1 saniye

---

## 🎯 SONUÇ VE TAVSİYELER

### Kritik Başarı Faktörleri
1. **Intent Doğruluğu:** Her intent'in doğru çalışması
2. **Yanıt Süresi:** Real-time trading için hızlı yanıt
3. **UI Sinyalleri:** Kullanıcı deneyimi için net sinyaller
4. **Ajan Koordinasyonu:** İki ajan arası senkronizasyon

### Geliştirme Öncelikleri
1. **Temel Intentler:** Strateji üretimi ve piyasa analizi
2. **Risk Yönetimi:** Acil durum ve limit kontrolleri
3. **UI Sinyalleri:** Kullanıcı dostu bildirimler
4. **Performans:** Hız ve doğruluk optimizasyonu

### Sonraki Adımlar
1. **Intent Implementasyonu:** Her intent için kod yazma
2. **UI Entegrasyonu:** Sinyalleri arayüze bağlama
3. **Test Senaryoları:** Her intent için test yazma
4. **Performans Optimizasyonu:** Hız ve doğruluk iyileştirme

---

**Sonuç:** 2-ajanlı mimari ile Spark Trading Platform, dünya çapında benzersiz bir değer önerisi sunmaktadır. Strateji Copilot ve Süpervizör Copilot'ın intent'leri net bir şekilde tanımlanmış ve UI/desktop entegrasyonu için gerekli sinyaller belirlenmiştir.
