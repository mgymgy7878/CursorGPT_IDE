import fs from "node:fs/promises";
import path from "node:path";

type Tenant = { apiKey: string; qps: number };
type Tenants = Record<string, Tenant>;
const counters = new Map<string, { ts: number; tokens: number }>();

async function loadTenants(): Promise<Tenants> {
  try {
    const j = await fs.readFile(
      process.env.TENANT_KEYS_FILE || "runtime/tenants.json",
      "utf8"
    );
    return JSON.parse(j);
  } catch {
    return {};
  }
}

function tokenBucket(id: string, qps: number, burst: number): boolean {
  const now = Date.now();
  const s = counters.get(id) || { ts: now, tokens: burst };
  const refill = ((now - s.ts) / 1000) * qps;
  s.tokens = Math.min(burst, s.tokens + refill);
  s.ts = now;
  
  if (s.tokens >= 1) {
    s.tokens -= 1;
    counters.set(id, s);
    return true;
  }
  
  counters.set(id, s);
  return false;
}

export function tenantMw() {
  let cache: Tenants = {};
  
  // Load tenants on startup
  (async () => {
    cache = await loadTenants();
  })();
  
  // Reload tenants every 15 seconds
  setInterval(async () => {
    cache = await loadTenants();
  }, 15000);
  
  const defQps = Number(process.env.TENANT_DEFAULT_QPS || 2);
  const burst = Number(process.env.TENANT_BURST || 4);
  
  return (req: any, res: any, next: any) => {
    // Skip tenant check for public endpoints
    if (req.path.startsWith('/api/public/') || 
        req.path === '/api/private/health' || 
        req.path === '/metrics') {
      return next();
    }
    
    const org = req.header("X-Org-Id") || "anonymous";
    const key = req.header("X-Api-Key") || "";
    const entry = cache[org];
    
    // Check authentication
    if (!entry || entry.apiKey !== key) {
      console.log(`[TENANT] Unauthorized: ${org}`);
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }
    
    // Check rate limit
    const ok = tokenBucket(org, entry.qps ?? defQps, burst);
    if (!ok) {
      console.log(`[TENANT] Rate limited: ${org}`);
      return res.status(429).json({ error: "RATE_LIMIT" });
    }
    
    // Add tenant info to response headers
    res.setHeader("X-Tenant", org);
    
    // TODO: Add tenant metrics
    // metrics.tenant.requests.inc({ org });
    
    next();
  };
} 