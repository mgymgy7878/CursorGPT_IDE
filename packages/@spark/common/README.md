# @spark/common

Spark Trading Platform ortak kütüphaneleri.

## Rate Limiting

### TokenBucket

```typescript
import { TokenBucket } from '@spark/common/rate-limit';

const bucket = new TokenBucket(10, 1); // 10 token, 1 token/saniye
await bucket.consume(); // 1 token tüket
```

### Sliding Window Rate Limiter

```typescript
import { createRateLimiter } from '@spark/common/rate-limit';

const limiter = createRateLimiter({ 
  maxPerInterval: 100, 
  intervalMs: 60000 
}); // 100 istek/dakika

await limiter('user123'); // Kullanıcı bazlı limit
```

## API

- `TokenBucket`: Token bucket rate limiter
- `createRateLimiter`: Sliding window rate limiter
- `RateLimitOptions`: Rate limit konfigürasyonu 