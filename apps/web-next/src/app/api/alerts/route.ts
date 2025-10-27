// apps/web-next/src/app/api/alerts/route.ts
export const runtime = 'nodejs';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://127.0.0.1:9090';

export async function GET() {
  try {
    const response = await fetch(`${PROMETHEUS_URL}/api/v1/alerts`, {
      method: 'GET',
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    console.error('Alerts proxy error:', err);
    // Return empty alerts if Prometheus not available
    return new Response(
      JSON.stringify({ status: 'success', data: { alerts: [] } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

