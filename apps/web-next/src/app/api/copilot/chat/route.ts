import { NextRequest, NextResponse } from 'next/server';

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Proxy to executor /ai/chat
    const res = await fetch(`${EXECUTOR_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: message }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Executor unavailable' },
        { status: 503 }
      );
    }

    const data = await res.json();

    // Increment Prometheus metric (if available)
    // spark_private_calls_total{endpoint="copilot_chat",verb="POST"}

    return NextResponse.json({
      response: data.response || data.text || 'Yanıt alınamadı',
    });
  } catch (error: any) {
    console.error('[Copilot Chat] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

