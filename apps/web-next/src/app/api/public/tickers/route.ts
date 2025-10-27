import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
export const revalidate = 0;

const EXECUTOR_URL = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols')?.split(',') || ['BTCUSDT'];

    // Try to fetch from executor backend
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `${EXECUTOR_URL}/api/public/binance/tickers?symbols=${symbols.join(',')}`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (fetchError) {
      console.log('Backend not available, using mock data');
    }

    // Mock fallback data
    const mockTickers = symbols.map(symbol => ({
      symbol,
      price: symbol === 'BTCUSDT' ? 43250.50 : 2250.75,
      change24h: Math.random() * 2000 - 1000,
      change24hPercent: Math.random() * 10 - 5,
      volume24h: Math.random() * 10000000000,
      high24h: symbol === 'BTCUSDT' ? 44000 : 2300,
      low24h: symbol === 'BTCUSDT' ? 42500 : 2200,
      lastUpdate: Date.now()
    }));

    return NextResponse.json(mockTickers);
  } catch (error) {
    console.error('Ticker API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickers' },
      { status: 500 }
    );
  }
}

