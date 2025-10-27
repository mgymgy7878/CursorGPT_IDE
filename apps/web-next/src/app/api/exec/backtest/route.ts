import { NextRequest, NextResponse } from 'next/server';

// Executor backend URL
const EXECUTOR_URL = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language = 'python' } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Kod parametresi gerekli' },
        { status: 400 }
      );
    }

    // Executor'a backtest isteği gönder
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout

    try {
      const response = await fetch(`${EXECUTOR_URL}/api/backtest/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          mode: 'quick',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend hatası: ${response.status}`);
      }

      const data = await response.json();

      // Başarılı yanıt
      return NextResponse.json({
        runId: data.runId || `run_${Date.now()}`,
        metrics: data.metrics || {
          totalReturn: data.total_return || 0,
          sharpeRatio: data.sharpe_ratio || 0,
          maxDrawdown: data.max_drawdown || 0,
          winRate: data.win_rate || 0,
          totalTrades: data.total_trades || 0,
          avgReturn: data.avg_return || 0,
        },
        status: 'success',
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Backtest zaman aşımına uğradı (30s)');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Backtest API hatası:', error);

    // Backend yoksa veya hataysa mock data dön (development için)
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Backend erişilemedi, mock data döndürülüyor');
      
      return NextResponse.json({
        runId: `mock_run_${Date.now()}`,
        metrics: {
          totalReturn: Math.random() * 40 - 10,
          sharpeRatio: Math.random() * 2 + 0.5,
          maxDrawdown: -(Math.random() * 15 + 5),
          winRate: Math.random() * 30 + 45,
          totalTrades: Math.floor(Math.random() * 100 + 50),
          avgReturn: Math.random() * 2 - 0.5,
        },
        status: 'success',
        _mock: true,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        status: 'error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Bu endpoint sadece POST metodu destekler' },
    { status: 405 }
  );
}

