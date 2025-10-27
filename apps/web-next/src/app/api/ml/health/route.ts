import { NextResponse } from 'next/server';

const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://127.0.0.1:4010';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch(`${ML_ENGINE_URL}/ml/health`, { 
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `HTTP ${res.status}` }, { status: 503 });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'ML Engine unavailable'
    }, { status: 503 });
  }
}

