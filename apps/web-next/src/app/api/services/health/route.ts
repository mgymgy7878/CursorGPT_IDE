import { NextResponse } from 'next/server';

const SERVICES = [
  { name: 'executor', url: process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001' },
  { name: 'ml', url: process.env.ML_ENGINE_URL || 'http://127.0.0.1:4010' },
  { name: 'streams', url: process.env.STREAMS_URL || 'http://127.0.0.1:4002' },
];

export async function GET() {
  const healthChecks = await Promise.allSettled(
    SERVICES.map(async (service) => {
      const start = Date.now();
      
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${service.url}/health`, {
          signal: controller.signal,
          cache: 'no-store'
        });

        clearTimeout(timeout);
        const latency = Date.now() - start;

        return {
          name: service.name,
          ok: res.ok,
          latency,
          status: res.status
        };
      } catch (error) {
        return {
          name: service.name,
          ok: false,
          error: error instanceof Error ? error.message : 'Connection failed',
          latency: Date.now() - start
        };
      }
    })
  );

  const health: Record<string, any> = {};

  healthChecks.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      health[SERVICES[index].name] = result.value;
    } else {
      health[SERVICES[index].name] = {
        name: SERVICES[index].name,
        ok: false,
        error: 'Health check failed'
      };
    }
  });

  // Mock canary data (replace with real canary check later)
  health.canary = {
    lastTest: new Date().toISOString(),
    passed: true,
    message: 'System operating normally'
  };

  return NextResponse.json(health);
}
