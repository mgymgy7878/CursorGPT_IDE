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

    const { prompt, code } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    if (prompt.length > 8000) {
      return NextResponse.json({ error: 'Prompt too long' }, { status: 400 });
    }

    const provider = process.env.STRATEGY_AI_PROVIDER ?? 'mock';

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
                content: `Sen bir trading "strategy AI"sın. Kullanıcının isteğini analiz et ve strateji kodu üret. 

Yanıt formatı:
{
  "code": "// strateji kodu buraya",
  "analysis": "kısa analiz açıklaması",
  "diagnostics": [
    {"severity": "info|warning|error", "line": 5, "message": "açıklama"}
  ]
}

Örnek strateji yapısı:
- RSI + trend filtresi
- MACD crossover
- Bollinger Bands
- Moving Average crossover
- Volume-based signals

Mevcut kod varsa onu iyileştir, yoksa yeni strateji üret.`
              },
              { 
                role: 'user', 
                content: `İstek: ${prompt}\n\nMevcut Kod:\n${code || '// Yeni strateji oluştur'}` 
              }
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
      code: `// ${prompt} için mock strateji
function strategy(data) {
  const rsi = calculateRSI(data.close, 14);
  const ma20 = calculateMA(data.close, 20);
  const ma50 = calculateMA(data.close, 50);
  
  if (rsi < 30 && data.close > ma20) {
    return { action: 'buy', reason: 'RSI oversold + trend support' };
  }
  
  if (rsi > 70 && data.close < ma20) {
    return { action: 'sell', reason: 'RSI overbought + trend resistance' };
  }
  
  return { action: 'hold', reason: 'No clear signal' };
}`,
      analysis: `${prompt} için RSI + trend filtresi stratejisi oluşturuldu. RSI 30 altında alım, 70 üstünde satım sinyali verir.`,
      diagnostics: [
        { severity: 'info', message: 'Strateji oluşturuldu' },
        { severity: 'warning', message: 'Backtest önerilir' }
      ]
    };

    const mockStream = `data: ${JSON.stringify({ delta: mockResponse.code })}\n\ndata: [DONE]\n\n`;
    
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
    console.error('Strategy AI error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 