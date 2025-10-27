# Proje Yol Haritası ve Planı — 2025-09-09

## Genel Plan ve Hedefler

Proje, Next.js 14 tabanlı bir frontend (`apps/web-next`) ve Node/Express tabanlı bir arka uç (`services/executor`) içeren bir monorepo mimarisine sahiptir. Tüm frontend sayfaları client component olarak çalışacak şekilde düzenlenmiş, SSR devre dışı bırakılmıştır (revalidate hata sınıfı bu sayede kalıcı olarak çözüldü). İstemci durumu için Zustand kullanılmakta; temel veriler (ör. strateji listesi, çalışan stratejiler) localStorage ile kalıcılaştırılmaktadır. Mevcut sayfa rotaları oluşturulmuş ve 404 hataları giderilmiştir (Ana Sayfa, Gözlem, Portföy, Strateji Lab, Stratejilerim, Çalışan Stratejiler, Ayarlar vb.). Sistem HEALTH=GREEN durumundadır: `/api/public/health` ve `/api/public/metrics/prom` uçları sorunsuz çalışır, tüm sayfalar hatasız yüklenir ve temel strateji akışı (Stratejilerim ➔ Lab ➔ Çalışan Stratejiler) çalışmaktadır.

## Ana Özellikler ve Kapsam

### 1) Strateji Yönetimi

- Yeni strateji oluşturma, AI Copilot yardımıyla kod üretme/iyileştirme, kaydetme ve “Stratejilerim” sayfasında kategori bazlı listeleme.
- Başlat/durdur/duraklat/yeniden başlat işlemleri “Çalışan Stratejiler” sayfasından yönetilir.

### 2) Gerçek Zamanlı Veri ve Piyasa Takibi

- Farklı borsalardan gerçek zamanlı piyasa verileri (ana sayfada canlı fiyatlar, mini grafikler).
- Portföyün ve açık pozisyonların anlık P/L takibi. WebSocket bağlantıları ve/veya borsa API’leri ile sürekli güncelleme.

### 3) Portföy ve Performans İzleme

- “Portföy” sayfasında bağlı borsa hesaplarının bakiyeleri, aktif pozisyonlar, toplam P/L.
- Strateji bazında performans istatistikleri, uzun dönem takip.

### 4) Backtest ve Optimizasyon

- Strateji Lab’da geçmiş veriyle backtest; sonuçların (getiri, max drawdown, win-rate vb.) raporlanması.
- Parametre optimizasyonu (indikatör eşikleri vb. aralık taraması). Arka planda executor + `@spark/backtest` kullanımı.

### 5) AI Copilot Entegrasyonu

- Cursor benzeri sabit bir AI paneli (global ve Lab özelinde) ile doğal dille strateji üretimi, kod iyileştirme, hata analizi.

### 6) Otomasyon ve Tetikleyiciler (Gelecek Aşama)

- Piyasa koşullarına göre otomatik başlat/durdur; gelişmiş otomasyon akışlarının yönetimi için kontrol paneli.

### 7) Gözlemleme ve Kayıt (Observability)

- Prometheus metriklerinin genişletilmesi (başlatma/durdurma sayıları, trade başarı oranları, hata sayaçları vb.).
- Grafana panelleri ve uygulama içi kritik durum göstergeleri.

## Süreklilik Gerektiren Konular

### Arayüz Tutarlılığı ve Stabilitesi

- “Tek ekranda görünüm” ilkesine uygun, kaydırma minimumda; Tailwind tabanlı tutarlı tasarım sistemi.
- UI değişikliklerinde görsel regresyon risklerini minimize etmek (gerekirse görsel testler/manüel turlar).

### Kullanıcı Deneyimi (UX) ve Erişilebilirlik

- Kritik bilgilerin önceliklendirilmesi (ana sayfada piyasa ve performans özeti).
- Erişilebilirlik: yüksek kontrast, ARIA etiketleri, klavye navigasyonu, çok dillilik altyapısı.

### Performans ve Gerçek Zamanlılık

- Dinamik import ve kod bölme; ağır bileşenlerin sayfa bazlı yüklenmesi.
- WS için otomatik yeniden bağlanma ve backoff stratejileri; minimal yeniden-render.

### Güvenlik ve Entegrasyon

- API anahtarlarının güvenli saklanması (kısa vadede localStorage, orta vadede sunucu tarafı/şifreleme).
- JWT ile kimlik doğrulama, hız limitleme, CORS/HTTPS kuralları; AI anahtarlarının güvenli kullanımı.

### Kalite, Test ve Devamlı İyileştirme

- Smoke/health genişletmeleri + UI fonksiyonel testleri (strateji oluşturma/başlatma/durdurma, veri güncelleme).
- Dokümantasyonun güncel tutulması (kullanıcı akışları, kurulum talimatları).

## Arayüz Tasarımı ve Sayfa Gereksinimleri

### Ana Sayfa (Dashboard)

- Paneller: Canlı Piyasa Verileri, Çalışan Stratejiler, Portföy Özeti.
- Sağda sabit AI Copilot paneli; dar ekranlarda gizlenebilir.
- Orta alanda 3 sütun düzeni ile kaydırmasız görünürlük (1080p hedef); responsive adaptasyon.

### Strateji Lab

- Kod editörü (Monaco vb., dinamik import), söz dizimi vurgulama, otomatik tamamlama.
- Üst toolbar: strateji adı, Kaydet / Backtest / Optimizasyon.
- Sağda AI Copilot; öneri ve kod ekleme akışı (onayla ekle butonu).
- Backtest/Optimizasyon sonuç paneli: getiri eğrisi, özet metrikler, yüklenme ve hata durumları.

### Stratejilerim

- Kategori bazlı liste (etiket veya tür grupları); kart ya da satır görünümü.
- Eylemler: Çalıştır, Backtest, Optimizasyon, Düzenle, Sil (onaylı, gerekiyorsa önce durdur).
- Arama/filtreleme, boş durum mesajları; “Yeni Strateji Oluştur” hızlı erişimi.

### Çalışan Stratejiler

- Aktif stratejiler listesi: durum, başlatılma zamanı, enstrüman, işlem sayısı, anlık P/L.
- Mini performans grafiği (sparkline), renkli durum etiketleri.
- Kontroller: Durdur, Duraklat/Devam (destek varsa), hızlı backtest.
- WS üzerinden anlık senkronizasyon; yalnız değişen bileşenlerin re-render edilmesi.

### Portföy

- Hesap/menkul varlık özeti; borsa bazlı sekmeler (örn. Binance).
- Tablo: Varlık, Miktar, Fiyat, Değer, Portföy%.
- İşlem özeti ve strateji bazlı P/L (ilk aşamada dummy veya kademeli entegrasyon).
- Elle yenile ve periyodik yenile; fiyat WS akışı ile anlık değer güncelleme.

### Ayarlar

- Tema/dil/tercihler; API anahtarları (Binance ve AI), test bağlantısı.
- Gelecekte gelişmiş ayarlar (varsayılan parametreler, veri kaynakları).
- Kaydetme ve bildirimler; form validasyonları.

## Arka Uç ve Entegrasyon Planı

### Borsa API Entegrasyonu (Öncelik: Binance)

- Fiyat, bakiye/pozisyon ve emir gönderim işlevleri; imzalama ve zaman senkronizasyonu.
- `@spark/connectors` var ise yeniden kullanım; yoksa ince arayüzlü istemci.

### Gerçek Zamanlı Veri Akışı

- Executor üzerinde WS kanalları: `marketData`, `strategyUpdates`.
- Frontend WS istemcisi: yeniden bağlanma, uyarılar, abone olunacak kanallar.

### Strateji Çalıştırma Motoru

- `/api/exec/start`, `/api/exec/stop` ile strateji kodu + parametrelerinin çalıştırılması.
- Risk (stop şartları) ve pozisyon yönetimi (çoklu pozisyon) geliştirmeleri yol haritasında.

### Backtest ve Optimizasyon Servisi

- `/api/exec/backtest`, `/api/exec/optimize` uçları (ilk aşamada senkron; gerekirse job tabanlı).
- JSON sonuçları ile UI görselleştirme; uzun işlemlerde ilerleme bilgisi.

### Veri Depolama

- Kısa vadede localStorage; orta vadede sunucu DB (strateji tanımı, backtest sonuçları, işlem geçmişi).

### Metrikler ve İzleme

- Sayaç/ölçümler: toplam/aktif strateji, günlük işlem, hata oranları; latency ve kaynak kullanımı.
- Geliştirme sürecinde performans darboğazlarının tespiti için ölçüm.

## Test, Kalite ve Stabilizasyon

### Arayüz Testleri

- Fonksiyonel akışlar: strateji oluştur-kaydet-çalıştır-durdur; veri güncellemeleri.
- Jest/RTL veya Cypress ile otomasyon; smoke/health genişletmeleri.

### Sürekli Entegrasyon ve Kontrol

- `tools/smoke.cjs` genişletmeleri; headless kontroller (DOM varlığı, HTTP 200 doğrulamaları).

### Kod Kalitesi ve İnceleme

- Type-safe sınırlar; ortak tiplerin `@spark/types` ile senkron kullanımı.
- PR incelemeleri: tasarım tutarlılığı, güvenlik, performans.

### Versiyonlama ve Geri Bildirim

- Küçük iterasyonlarla kararlı değişim; onay mekanizmaları; Figma/çizimle ön mutabakat.

### Erişilebilirlik ve Tarayıcı Uyumu

- Chrome/Firefox testleri; 1080p masaüstü hedef; temel responsive.
- Klavye navigasyonu, ekran okuyucu kontrolleri.

### Performans İzleme

- Next.js analizleri, Chrome Profiler; ağır bileşenlerin sayfa bazlı yüklenmesi.
- Sorun halinde code-splitting stratejisinin ayarlanması.

## Riskler ve Önlemler

- UI karmaşıklığı ve layout bozulmaları: Tutarlı grid/flex; her büyük ekleme sonrası sayfa turu.
- Entegrasyon riskleri: API hataları/limitleri; kullanıcıya anlaşılır hata bildirimi; simülasyon testleri.
- AI Copilot sınırlamaları: Yavaş/yanlış sonuç; loading durumları; “önce göster-sonra uygula” akışı.
- Güvenlik açıkları: Anahtar sızıntısı ve tehlikeli kod; sandbox, oran sınırlamaları, loglama.

## Günlük Plan (10 Günlük Sprint)

- Gün 1: Layout ve Ana Sayfa taslağı (sidebar, üst bar, sağ sabit Copilot; 3 panel, dummy veriler, responsive; Copilot toggle).
- Gün 2: Ana Sayfa işlevselliği (piyasa verileri API/WS hazırlığı; çalışan stratejiler store; portföy özeti dummy; Copilot interaktif iskelet).
- Gün 3: Strateji Lab UI (Monaco, toolbar, Copilot entegrasyonu, sonuç paneli placeholder; buton eylemleri simülasyonu).
- Gün 4: AI Copilot gerçek entegrasyon (OpenAI anahtarı; proxy uç veya doğrudan test; yanıt biçimleme; “Kodu Editöre Ekle”).
- Gün 5: Backtest entegrasyonu (executor API; loading; Chart.js/Recharts ile grafik; özet metrikler; basit optimizasyon girişi).
- Gün 6: Stratejilerim (persist kaydetme, kategorileme, eylem butonları; Lab’a yönlendirme; silme akışı).
- Gün 7: Çalışan Stratejiler (liste, WS güncellemeleri, mini grafik, durdur/duraklat; hızlı backtest opsiyonu).
- Gün 8: Portföy gerçek verileri (Binance entegrasyonu; bakiye+fiyat çarpımı; tablo; dummy işlem özeti; yenile/periodik).
- Gün 9: Ayarlar ve UX cilası (tema/dil; API key saklama ve test; Copilot anahtarı; boş/yüklenme/hata durumları; toast; küçük stil düzeltmeleri).
- Gün 10: E2E test ve stabilizasyon (uçtan uca senaryolar; hata düzeltme; performans/gözden geçirme; dokümantasyon notları).

> Not: Plan esnektir; bağımlılıklara göre günler kaydırılabilir. Öncelik arayüz stabilitesi, temel özelliklerin çalışır hale gelmesi ve entegrasyonların güvenilirliği.
