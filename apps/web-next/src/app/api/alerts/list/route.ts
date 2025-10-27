import { NextResponse } from 'next/server';

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const statusRes = await fetch(`${EXECUTOR_URL}/tools/get_status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });

    const alerts: any[] = [];

    if (statusRes.ok) {
      const json = await statusRes.json();
      
      // Demo: Basit alert üretimi (gerçek implementasyonda Prometheus/Alertmanager)
      if (json?.queues?.backtests?.lag_ms > 5000) {
        alerts.push({
          id: 'q-lag',
          level: 'warning',
          source: 'optimizer',
          message: 'Backtest kuyruğu gecikmesi',
          ts: Date.now(),
        });
      }
      
      // PSI drift alert example
      if (json?.metrics?.psi > 0.2) {
        alerts.push({
          id: 'psi-drift',
          level: 'critical',
          source: 'ml-engine',
          message: 'PSI drift threshold exceeded',
          ts: Date.now(),
        });
      }
    }

    return NextResponse.json({ ok: true, items: alerts });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, items: [], error: 'unavailable' },
      { status: 503 }
    );
  }
}

