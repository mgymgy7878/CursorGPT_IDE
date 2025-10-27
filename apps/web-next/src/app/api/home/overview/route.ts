import { NextResponse } from 'next/server';

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';

async function jsonFetch(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  // Fetch status
  const status = (await jsonFetch(`${EXECUTOR_URL}/tools/get_status`)) ?? {};

  // Fetch orders
  const ordersData =
    (await jsonFetch(`${EXECUTOR_URL}/tools/get_orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })) ?? {};
  const orders = ordersData?.open ?? [];

  // Fetch positions
  const positionsData =
    (await jsonFetch(`${EXECUTOR_URL}/tools/get_positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })) ?? {};
  const positions = positionsData?.positions ?? [];

  // Fetch metrics
  let metrics: any = {};
  try {
    const metricsRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/metrics/summary`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(2500),
      }
    );
    if (metricsRes.ok) {
      metrics = await metricsRes.json();
    }
  } catch {
    metrics = { p95_ms: 0, error_rate: 0, psi: 0, match_rate: 0 };
  }

  // Alerts placeholder (future: Prometheus/Alertmanager)
  const alerts: any[] = [];

  return NextResponse.json({
    status,
    metrics,
    orders,
    positions,
    alerts,
  });
}

