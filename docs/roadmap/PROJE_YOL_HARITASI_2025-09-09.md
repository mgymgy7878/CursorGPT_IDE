# Proje Yol Haritası — 2025-09-09

> **Status:** `HEALTH=GREEN` · `Version: v1.11.8+docs` · `Updated: 2025-10-13`

## İçindekiler
- [Vizyon & Kapsam](#vizyon--kapsam)
- [Zaman Çizelgesi](#zaman-çizelgesi)
- [Sprint v1.11.x](#sprint-v111x)
- [SLO & Alarm](#slo--alarm)
- [ML Signal Fusion](#ml-signal-fusion)
- [Release Checklist](#release-checklist)

## Vizyon & Kapsam
Platformun orta-vadeli ürün/teknik hedeflerini özetler; SLO’lar ve operasyon metrikleri ile uyumluluk korunur.

## Zaman Çizelgesi
Gün 1–10 sprint dilimleri ve teslim kalemleri. Sabit başlıklar çapa olarak kullanılabilir.

## Sprint v1.11.x
- v1.11.5.x: Canary smoke geçmişi, ZIP, paging, ETag
- v1.11.6: P95 hedef bandı, eşik rozetleri, uyarı taslakları
- v1.11.7: SLO→Alarm zinciri, webhook, parametrik kurallar
- v1.11.8: Routing, hysteresis, maintenance, auto-actions

## SLO & Alarm
- Prometheus kural şablonu: `docs/monitoring/SLO-RULES.template.yml`
- Render script: `scripts/render-slo-rules.ps1`
- Alertmanager yönlendirme: `docs/monitoring/ALERTMANAGER-ROUTING.md`

## ML Signal Fusion
v2.0 döneminde çoklu sinyal kaynakları ve önceliklendirme.

## Release Checklist
Ayrıca kökte `RELEASE_CHECKLIST.md` olarak da mevcuttur.
