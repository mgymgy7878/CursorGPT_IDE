Proje Yol Haritası ve Planı — 2025-09-09

Bu belge, Spark Trading Platform için tek ekranda görünür (scroll’suz), sabit Copilot paneli ve canlı veri odaklı bir UI/UX mimarisi ile; Strateji Lab (AI destekli), Backtest/Optimizasyon, Portföy izleme ve Çalışan Stratejiler kontrol akışlarını kapsar.
Durum: HEALTH=GREEN · Web: 3003 · Executor: 4001

1. UI/UX Gereksinimleri (Özet)

Ana Sayfa: Canlı Piyasa Verileri · Çalışan Stratejiler · Portföy Özeti · Sağda sabit AI Copilot (dar ekranda gizlenebilir).

Strateji Lab: Monaco Editor, AI Copilot (kod üret/iyileştir), Backtest/Optimizasyon butonları, sonuç paneli (getiri eğrisi + metrikler).

Stratejilerim: Kategori bazlı liste · Çalıştır / Durdur / Duraklat / Backtest / Optimize / Düzenle / Sil.

Çalışan Stratejiler: Canlı durum + mini P/L grafiği · Durdur / Duraklat / Devam · Hızlı backtest opsiyonu.

Portföy: Borsa bazlı sekmeler, bakiye + varlık tablosu (Miktar/Fiyat/Değer/%), işlem özeti ve strateji bazlı P/L.

Ayarlar: Tema/dil, AI API anahtarı, borsa API key/secret, bağlantı testi.

2. Backend & Entegrasyon

Borsa Entegrasyonu (öncelik: Binance): fiyat, bakiye/pozisyon, emir gönderimi; imzalama & timestamp.

Gerçek Zamanlılık: Executor WS kanalları: marketData, strategyUpdates · frontend’de reconnect/backoff.

Strateji Motoru: /api/exec/start · /api/exec/stop (+ duraklat/continue desteği) · risk & pozisyon yönetimi yol haritasında.

Backtest/Optimize Servisi: /api/exec/backtest · /api/exec/optimize · JSON sonuç + UI grafik.

Depolama: Kısa vadede localStorage; orta vadede DB (strateji, sonuçlar, işlem geçmişi).

Metrikler: Prometheus: aktif strateji sayısı, trade sayısı, hata oranı, latency; Grafana panelleri.

3. Kalite, Güvenlik, Performans

Test: smoke/health genişletmeleri · UI fonksiyonel akış testleri (Cypress/Playwright).

Güvenlik: JWT, rate-limit, CORS/HTTPS; AI & borsa anahtarlarının güvenli saklama stratejisi.

Performans: Dinamik import, sadece değişen bileşenleri render · grafik/editör gibi ağır bileşenler sayfa bazlı yüklenir.

Erişilebilirlik: Yüksek kontrast, ARIA, klavye navigasyonu; TR/EN dil altyapısı.

4. 10 Günlük Sprint Planı

G1: Layout & Ana Sayfa taslağı (sidebar/üst bar, sağ sabit Copilot, 3 panel dummy veri, 1080p’de scroll yok).

G2: Ana Sayfa işlevsellik (piyasa verisi API/WS, çalışan strateji store, portföy özeti dummy, Copilot UI iskelet).

G3: Strateji Lab UI (Monaco, toolbar: Kaydet/Backtest/Optimize, sonuç paneli placeholder, Copilot entegrasyonu).

G4: AI Copilot gerçek entegrasyonu (OpenAI key, proxy uç, “Kodu Editöre Ekle”).

G5: Backtest entegrasyonu (executor API, loading, Chart/Recharts grafik, temel metrikler; basit optimize formu).

G6: Stratejilerim (persist & kategorileme; Çalıştır/Backtest/Optimize/Düzenle/Sil; Lab’a yönlendirme akışı).

G7: Çalışan Stratejiler (liste, WS güncellemeleri, mini P/L grafiği, durdur/duraklat/continue, hızlı backtest).

G8: Portföy entegrasyonu (bakiye/varlık tablosu, fiyat × miktar, periyodik yenile; WS fiyatlarıyla anlık değer).

G9: Ayarlar & UX cilası (tema/dil; AI & borsa anahtarı; boş/yüklenme/hata & toast; küçük stil düzeltmeleri).

G10: E2E senaryolar + stabilizasyon (uçtan uca test, performans gözden geçirme, dokümantasyon notları).

5. Riskler & Önlemler

UI karmaşıklığı → tutarlı grid/flex + her büyük ekleme sonrası görsel tur.

API kısıtları/limitleri → kullanıcıya net hata; mock/simülasyonla DO dev testleri.

AI sınırlamaları → loading & “önce göster-sonra uygula” akışı; kod ekleme önce onaylı.

Güvenlik → anahtar sızıntısına karşı saklama stratejisi, oran sınırlama, audit log.

6. Hızlı Komutlar (Smoke)

GET /healthz (web & executor) · GET /api/public/metrics → # HELP kontrol

POST /api/exec/backtest {} → JSON sonuç > 0B · WS reconnect test

Referans bağlantıları: README.md (Docs / Quick Links), Roadmap.md ve ARAYUZ_GELISTIRME_PLANI.md

7. Evidence (Kanıtlar)

- UI v2.2 kabul kanıtları: `docs/evidence/dev/v2.2-ui/`
- Önerilen içerikler: `smoke_confirm_gate.txt`, `uds_lifecycle.txt`, `positions_snapshot.json`, `metrics_dump.prom`, `alerts.rules`, `ui_walkthrough.mp4`
