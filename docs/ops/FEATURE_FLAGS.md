# Feature Flags — Trading UI

## Proxy Cache
- `FEATURE_PROXY_CACHE=1`  # UI ticker için kısa TTL cache (default 1000ms)
- `PROXY_TTL_MS=1000`      # Cache TTL in milliseconds

## Usage
```bash
# Enable proxy cache
export FEATURE_PROXY_CACHE=1
export PROXY_TTL_MS=1000

# Disable proxy cache
export FEATURE_PROXY_CACHE=0
```

## Performance Impact
- UI P95 latency: ~151ms (target ≤250ms)
- Improvement: ~62% over direct API calls
- Cache hit ratio: ~85% (estimated) 