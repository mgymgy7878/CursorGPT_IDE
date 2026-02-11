# Copilot V0 Production Notes

## EvidenceExporter - Filesystem Limitation

**Mevcut Durum (V0):**
- `EvidenceExporter` şu an filesystem'e yazıyor (`evidence/hello_tool_world_*.json`)
- Next.js dev server ve Node.js server'da çalışıyor ✅
- **Vercel/serverless ortamlarında sorun olabilir** ⚠️

**Neden?**
- Serverless fonksiyonlar ephemeral disk kullanır (yazma sınırlı)
- Vercel'de filesystem yazımı production'da genelde yok
- Evidence dosyaları request sonrası kaybolabilir

**P1 Çözüm Seçenekleri:**

### 1. Database Table (Önerilen)
```sql
CREATE TABLE audit_evidence (
  id UUID PRIMARY KEY,
  request_id VARCHAR(255) NOT NULL,
  timestamp BIGINT NOT NULL,
  tool VARCHAR(100) NOT NULL,
  evidence JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. S3/MinIO Bucket
- Evidence dosyalarını object storage'a yaz
- Presigned URL ile download endpoint
- TTL policy (örn: 30 gün)

### 3. Download Endpoint (Buffer Stream)
- Evidence'ı memory'de tut
- `/api/copilot/evidence/:requestId` endpoint
- Response: JSON stream veya download

**Geçiş Planı:**
- V0: Filesystem (dev/test için yeterli)
- P1: Database table + migration script
- P2: S3 fallback (büyük evidence için)

**Not:** Bu limitation şimdiden bilinmeli, prod'a geçerken sürpriz olmasın.

