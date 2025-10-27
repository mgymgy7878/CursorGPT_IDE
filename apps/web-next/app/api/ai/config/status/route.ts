import { loadAIConfig } from '@/lib/aiSecrets';

export async function GET() {
  try {
    const cfg = loadAIConfig();
    if (!cfg.ok) return new Response(JSON.stringify({ ok:false }), { status: 200 });
    return new Response(JSON.stringify({ ok:true, provider: cfg.provider, baseUrl: cfg.baseUrl, hasKey: true }), { status: 200 });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error: e.message }), { status: 500 });
  }
}
