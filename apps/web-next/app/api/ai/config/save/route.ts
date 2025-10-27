import { NextRequest } from 'next/server';
import { saveAIConfig } from '@/lib/aiSecrets';

export async function POST(req: NextRequest) {
  try {
    const { provider, baseUrl, apiKey } = await req.json();
    if (!provider || !apiKey) return new Response(JSON.stringify({ ok:false, error:'provider/apiKey required' }), { status: 400 });
    saveAIConfig({ provider, baseUrl, apiKey });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error: e.message }), { status: 500 });
  }
}
