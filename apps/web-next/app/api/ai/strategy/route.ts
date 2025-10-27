import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const provider = process.env.AI_PROVIDER || 'openai';
  const apiKey = process.env.AI_API_KEY || '';
  const base = process.env.AI_API_BASE || 'https://api.openai.com/v1';

  if (!apiKey) return new Response(JSON.stringify({ error: 'AI_API_KEY missing' }), { status: 400 });

  // Basit bir "strateji çıktısı" şeması: { code: "(JS strategy module as string)", meta: {...} }
  const system = `You are a trading-strategy generator. Output valid JSON with keys: code (string of JS), meta (object).`;
  const user = `Generate a Binance Futures-compatible JS strategy that exports default async function run(ctx) { ... }  
  The ctx provides: { market: { ticker(symbol) }, order: { market(symbol, side, qty) }, risk: { maxDailyLoss } }.  
  Only use symbols the user passes. Keep it simple (EMA cross example ok).  
  Return JSON ONLY.`;

  // OpenAI style request (gpt-4o-mini, etc.)
  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [ { role: 'system', content: system }, { role: 'user', content: `${user}\nUSER_PROMPT: ${prompt}` } ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content || '{}';
  return new Response(content, { headers: { 'content-type': 'application/json' } });
}
