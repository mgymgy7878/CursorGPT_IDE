// apps/web-next/src/app/api/ai/exec/route.ts
export const runtime = 'nodejs';

const EXECUTOR_URL = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const response = await fetch(`${EXECUTOR_URL}/ai/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-spark-role': 'trader', // Default trader role
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
    console.error('AI exec proxy error:', err);
    return new Response(
      JSON.stringify({ error: 'ProxyError', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

