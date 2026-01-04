import { NextRequest, NextResponse } from "next/server";
import { fetchSafe } from "@/lib/net/fetchSafe";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, timeframe, risk, notes } = body;

    // Try to connect to executor service first
    const executorUrl = `${EXECUTOR_BASE}/copilot/strategy.generate`;
    
    try {
      const executorRes = await fetchSafe(executorUrl, {
        method: "POST",
        body: { symbol, timeframe, risk, notes },
        headers: { "Content-Type": "application/json" },
        timeoutMs: 30000, // 30s timeout for AI generation
      });

      if (executorRes.ok && executorRes.data) {
        return NextResponse.json(executorRes.data);
      }
    } catch (executorError) {
      console.warn("[copilot/strategy/generate] Executor service unavailable, using fallback:", executorError);
      // Fall through to fallback suggestions
    }

    // Fallback: Mock suggestions if executor is unavailable
    // This ensures UI works even when executor service is down
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const suggestions = {
      conservative: [
        {
          id: "conservative-1",
          title: "EMA Trend Following",
          description: "Slow-moving averages with wide stops for steady gains",
          indicators: ["EMA(50)", "EMA(200)", "ATR(20)"],
          rationale:
            "Low-frequency trend following with volatility-based risk management",
          riskLevel: "conservative" as const,
        },
        {
          id: "conservative-2",
          title: "Moving Average Crossover",
          description: "Golden/Death cross with volume confirmation",
          indicators: ["SMA(50)", "SMA(200)", "Volume SMA"],
          rationale:
            "Classic trend detection with volume filter to reduce false signals",
          riskLevel: "conservative" as const,
        },
      ],
      moderate: [
        {
          id: "moderate-1",
          title: "RSI Divergence Strategy",
          description: "RSI overbought/oversold with MACD confirmation",
          indicators: ["RSI(14)", "MACD", "Volume"],
          rationale:
            "Mean reversion with momentum confirmation for balanced returns",
          riskLevel: "moderate" as const,
        },
        {
          id: "moderate-2",
          title: "Bollinger Bands Squeeze",
          description: "Bollinger squeeze breakout with volume surge",
          indicators: ["BB(20,2)", "Volume", "ADX"],
          rationale:
            "Volatility contraction followed by expansion with trend strength filter",
          riskLevel: "moderate" as const,
        },
        {
          id: "moderate-3",
          title: "Stochastic Pullback",
          description: "Stochastic oversold with EMA support",
          indicators: ["Stochastic(14,3)", "EMA(21)", "Volume"],
          rationale:
            "Pullback entry with trend confirmation for higher win rate",
          riskLevel: "moderate" as const,
        },
      ],
      aggressive: [
        {
          id: "aggressive-1",
          title: "Scalping Breakout",
          description: "Fast EMA cross with tight stops and high frequency",
          indicators: ["EMA(9)", "EMA(21)", "RSI(7)"],
          rationale: "High-frequency trading with quick exits for rapid gains",
          riskLevel: "aggressive" as const,
        },
        {
          id: "aggressive-2",
          title: "Volume Spike Momentum",
          description: "Volume surge with price momentum and tight stops",
          indicators: ["Volume Spike", "Price Momentum", "ATR(10)"],
          rationale:
            "Capture short-term momentum bursts with aggressive risk/reward",
          riskLevel: "aggressive" as const,
        },
      ],
    };

    const riskSuggestions =
      suggestions[risk as keyof typeof suggestions] || suggestions.moderate;

    return NextResponse.json({ suggestions: riskSuggestions });
  } catch (error) {
    console.error("Strategy generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate strategies" },
      { status: 500 }
    );
  }
}
