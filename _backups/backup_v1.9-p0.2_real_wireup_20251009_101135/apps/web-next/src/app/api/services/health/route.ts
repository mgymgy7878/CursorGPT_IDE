import { NextResponse } from 'next/server';

const SERVICES = [
  { name: 'ml', url: 'http://127.0.0.1:4010/ml/health' },
  { name: 'export', url: 'http://127.0.0.1:4001/export/health' },
  { name: 'executor', url: 'http://127.0.0.1:4001/health' },
  { name: 'streams', url: 'http://127.0.0.1:4002/health' },
];

export async function GET() {
  const results = await Promise.allSettled(
    SERVICES.map(async s => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        const res = await fetch(s.url, { 
          cache: 'no-store', 
          signal: controller.signal 
        });
        
        clearTimeout(timeout);
        const data = await res.json();
        return { name: s.name, ok: res.ok, data };
      } catch (e) {
        return { name: s.name, ok: false, error: e instanceof Error ? e.message : 'Unknown' };
      }
    })
  );
  
  const health: Record<string, any> = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      health[SERVICES[i].name] = r.value;
    } else {
      health[SERVICES[i].name] = { ok: false, error: 'Timeout or error' };
    }
  });
  
  return NextResponse.json(health);
}

