import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Rate limiting için basit in-memory cache
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimit.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + 5 * 60 * 1000 }); // 5 dakika
    return true;
  }
  
  if (limit.count >= 60) return false; // 60 req/5dk
  limit.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    if (prompt.length > 8000) {
      return NextResponse.json({ error: 'Prompt too long' }, { status: 400 });
    }

    const provider = process.env.MANAGER_AI_PROVIDER ?? 'mock';

    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            stream: true,
            messages: [
              { 
                role: 'system', 
                content: 'Sen bir trading "manager AI"sın. Kullanıcının komutlarını analiz et ve JSON formatında yanıt ver. Format: {"summary": "kısa özet", "actions": [{"type": "mode|start|stop|risk", "value": "değer"}]}. Örnek: "rejim trend, risk %0.5" → {"summary": "Trend rejimi ve %0.5 risk ayarlandı", "actions": [{"type": "mode", "value": "trend"}, {"type": "risk", "value": 0.5}]}'
              },
              { role: 'user', content: prompt }
            ]
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);
        
        if (!r.ok) {
          throw new Error(`OpenAI API error: ${r.status}`);
        }

        // SSE passthrough
        return new NextResponse(r.body, {
          headers: { 
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error('OpenAI API error:', error);
        // Fallback to mock
      }
    }

    // Mock fallback
    const mockResponse = {
      summary: `${prompt} → (mock) rejim trend, risk %0.5 ayarlandı`,
      actions: [
        { type: 'mode', value: 'trend' },
        { type: 'risk', value: 0.5 }
      ]
    };

    const mockStream = `data: ${JSON.stringify({ delta: mockResponse.summary })}\n\ndata: [DONE]\n\n`;
    
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(mockStream));
        controller.close();
      }
    });

    return new NextResponse(stream, { 
      headers: { 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      } 
    });

  } catch (error) {
    console.error('Manager AI error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 