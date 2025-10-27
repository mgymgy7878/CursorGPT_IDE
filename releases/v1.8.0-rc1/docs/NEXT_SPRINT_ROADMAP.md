# Sonraki Sprint Net Kazanımlar

## 1. UI Header Bar: Role/Actor localStorage
- **Hedef:** Tüm fetch'lere otomatik header ekleme
- **Teknik:** localStorage.getItem('role'), localStorage.getItem('actor')
- **UX:** Dropdown ile role değiştirme, actor input

## 2. Diff UX: "Yalnız Değişenleri Göster" Toggle
- **Hedef:** Yan-yana görünüm + toggle
- **Teknik:** React state + CSS grid
- **UX:** oldVal vs newVal karşılaştırması

## 3. Ops Raporu: Günlük PDF/CSV
- **Hedef:** Approve/deny sayıları, benzersiz actor'ler, 4xx oranı, P95
- **Teknik:** Node.js script + PDF/CSV generation
- **Schedule:** Günlük 09:00'da otomatik

## 4. Rate Limiting: 5/10s
- **Hedef:** RBAC + rate-limit kombinasyonu
- **Teknik:** @fastify/rate-limit + RBAC middleware
- **Güvenlik:** DDoS koruması

## 5. Idempotency-Key: Çift Tıklama Güvenliği
- **Hedef:** Approve/Deny'de idempotency
- **Teknik:** Redis cache + unique key
- **UX:** Çift tıklama koruması

## 6. Audit Rotasyon: 10MB × 7 Gün
- **Hedef:** Günlük zip + SHA256 manifest
- **Teknik:** node-cron + tar.gz + checksum
- **Ops:** Otomatik arşivleme

## 7. Prometheus Dashboard: Grafana
- **Hedef:** Real-time metrikler
- **Teknik:** Grafana + Prometheus
- **Panels:** approve/deny rates, 4xx trends, actor activity

## 8. API Documentation: OpenAPI
- **Hedef:** Swagger UI
- **Teknik:** @fastify/swagger
- **Endpoint:** /docs

## 9. Integration Tests: Jest
- **Hedef:** E2E test coverage
- **Teknik:** Jest + Supertest
- **Coverage:** RBAC, audit, metrics

## 10. Monitoring: Health Checks
- **Hedef:** Kubernetes readiness/liveness
- **Teknik:** /health, /ready endpoints
- **Ops:** Auto-restart on failure
