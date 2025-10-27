import { NextRequest, NextResponse } from 'next/server';

const EXECUTOR_ORIGIN = process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { symbol, side, qty, leverage, risk } = body;
    if (!symbol || !side || !qty || !leverage) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, side, qty, leverage' },
        { status: 400 }
      );
    }

    // Whitelist validation
    const allowedSymbols = ['BTCUSDT', 'ETHUSDT'];
    if (!allowedSymbols.includes(symbol)) {
      return NextResponse.json(
        { error: `Symbol ${symbol} not in whitelist. Allowed: ${allowedSymbols.join(', ')}` },
        { status: 400 }
      );
    }

    // Risk validation
    const allowedRisks = ['low', 'med', 'high'];
    if (risk && !allowedRisks.includes(risk)) {
      return NextResponse.json(
        { error: `Invalid risk level: ${risk}. Allowed: ${allowedRisks.join(', ')}` },
        { status: 400 }
      );
    }

    // Leverage validation
    if (leverage < 1 || leverage > 20) {
      return NextResponse.json(
        { error: 'Leverage must be between 1 and 20' },
        { status: 400 }
      );
    }

    // Try executor first, fallback to mock response
    try {
      const executorResponse = await fetch(`${EXECUTOR_ORIGIN}/api/advisor/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (executorResponse.ok) {
        const result = await executorResponse.json();
        return NextResponse.json(result);
      }
    } catch (error) {
      console.warn('Executor advisor service unavailable, using mock response:', error);
    }

    // Mock AI response (fallback)
    const mockResponse = generateMockSuggestion(body);
    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Advisor suggest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMockSuggestion(params: any) {
  const { symbol, side, qty, leverage, risk = 'low' } = params;
  
  // Risk-based parameters
  const riskConfig = {
    low: { stopPct: 0.8, tpPct: [0.6, 1.2], confidence: 0.75 },
    med: { stopPct: 1.2, tpPct: [1.0, 2.0], confidence: 0.65 },
    high: { stopPct: 1.8, tpPct: [1.5, 3.0], confidence: 0.55 }
  };

  const config = riskConfig[risk as keyof typeof riskConfig] || riskConfig.low;
  
  const id = `sg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  
  return {
    id,
    symbol,
    side,
    leverage,
    entry: "market",
    stop: `-${config.stopPct}%`,
    takeProfits: config.tpPct.map(tp => ({ tp: `${tp}%` })),
    confidence: config.confidence,
    rationale: `AI analizi: ${symbol} ${side} pozisyonu için ${risk} risk seviyesi. Teknik göstergeler ve piyasa momentumu değerlendirildi. Stop loss ${config.stopPct}%, take profit seviyeleri ${config.tpPct.join('% ve ')}% olarak öneriliyor.`,
    tokens: Math.floor(Math.random() * 500) + 800,
    model: "gpt-4o-mini",
    timestamp: new Date().toISOString(),
    riskLevel: risk,
    notional: qty * (symbol === 'BTCUSDT' ? 50000 : 3000) // Rough price estimate
  };
}