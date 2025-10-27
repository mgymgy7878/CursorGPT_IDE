// apps/web-next/src/app/api/futures/positions/route.ts
export const runtime = 'nodejs';

const EXECUTOR_URL = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';

export async function GET() {
  try {
    const response = await fetch(`${EXECUTOR_URL}/futures/positions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    console.error('Futures positions proxy error:', err);
    return new Response(
      JSON.stringify([]),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

