import { NextResponse } from 'next/server';

const EXECUTOR_URL = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';

export async function GET() {
  try {
    // Try to fetch real metrics
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${EXECUTOR_URL}/metrics`, {
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeout);

      if (res.ok) {
        const metricsText = await res.text();

        // Parse Prometheus metrics (simple version)
        const activeStrategies = parseMetric(metricsText, /active_strategies_count\s+([\d.]+)/);
        const totalStrategies = parseMetric(metricsText, /total_strategies_count\s+([\d.]+)/);
        const totalTrades = parseMetric(metricsText, /total_trades_count\s+([\d.]+)/);
        const dailyPnL = parseMetric(metricsText, /daily_pnl_usd\s+([-\d.]+)/);
        const systemUptimeSeconds = parseMetric(metricsText, /system_uptime_seconds\s+([\d.]+)/);

        // Convert uptime to percentage string (assuming 24h = 86400s)
        const systemUptime = systemUptimeSeconds 
          ? ((systemUptimeSeconds / 86400) * 100).toFixed(1)
          : '0.0';

        return NextResponse.json({
          activeStrategies,
          totalStrategies,
          totalTrades,
          dailyPnL: dailyPnL.toFixed(2),
          systemUptime
        });
      }
    } catch (fetchError) {
      console.log('Metrics backend not available');
    }

    // Mock fallback
    const mockMetrics = {
      activeStrategies: Math.floor(Math.random() * 5) + 1,
      totalStrategies: Math.floor(Math.random() * 10) + 5,
      totalTrades: Math.floor(Math.random() * 200) + 50,
      dailyPnL: (Math.random() * 1000 - 200).toFixed(2),
      systemUptime: '99.8'
    };

    return NextResponse.json(mockMetrics);
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      {
        activeStrategies: 0,
        totalStrategies: 0,
        totalTrades: 0,
        dailyPnL: '0.00',
        systemUptime: '0.0'
      },
      { status: 200 } // Return 200 to prevent UI errors
    );
  }
}

function parseMetric(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  return match ? parseFloat(match[1]) : 0;
}
