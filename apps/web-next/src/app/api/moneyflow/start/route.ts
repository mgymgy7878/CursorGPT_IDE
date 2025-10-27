// apps/web-next/src/app/api/moneyflow/start/route.ts
export const runtime = 'nodejs';

const EXECUTOR_URL = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const response = await fetch(`${EXECUTOR_URL}/moneyflow/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    console.error('Money flow start proxy error:', err);
    return new Response(
      JSON.stringify({ error: 'ProxyError', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

