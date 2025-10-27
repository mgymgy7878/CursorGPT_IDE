// apps/web-next/src/app/api/metrics/route.ts
export const runtime = 'nodejs';

const EXECUTOR_URL = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';

export async function GET() {
  try {
    const response = await fetch(`${EXECUTOR_URL}/metrics`, {
      method: 'GET',
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  } catch (err: any) {
    console.error('Metrics proxy error:', err);
    return new Response(
      '# Metrics unavailable',
      { status: 200, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}

