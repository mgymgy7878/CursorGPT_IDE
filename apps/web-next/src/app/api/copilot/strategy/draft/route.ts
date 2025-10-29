import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { suggestion, symbol, timeframe, risk } = await req.json();

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate code based on suggestion
    const code = generateStrategyCode(suggestion, symbol, timeframe, risk);

    return NextResponse.json({ code });
  } catch (error) {
    console.error("Draft creation error:", error);
    return NextResponse.json(
      { error: "Failed to create draft" },
      { status: 500 }
    );
  }
}

function generateStrategyCode(
  suggestion: any,
  symbol: string,
  timeframe: string,
  risk: string
): string {
  const params = {
    conservative: { stopLoss: 0.03, takeProfit: 0.06, maxPosition: 0.1 },
    moderate: { stopLoss: 0.05, takeProfit: 0.15, maxPosition: 0.2 },
    aggressive: { stopLoss: 0.08, takeProfit: 0.24, maxPosition: 0.3 },
  };

  const p = params[risk as keyof typeof params] || params.moderate;

  return `// ${suggestion.title} - ${symbol} (${timeframe})
// Risk Profile: ${risk}

export const config = {
  symbol: "${symbol}",
  timeframe: "${timeframe}",
  indicators: {
    // ${suggestion.indicators?.join(", ") || "EMA(20), EMA(50)"}
    fastPeriod: 20,
    slowPeriod: 50,
    atrPeriod: 14,
  },
  entry: {
    type: "${suggestion.id.includes("crossover") || suggestion.id.includes("cross") ? "crossover" : "signal"}",
    fast: 'EMA',
    slow: 'EMA',
  },
  exit: {
    stopLoss: ${p.stopLoss},
    takeProfit: ${p.takeProfit},
    trailingStop: ${risk === "conservative" ? "0.02" : risk === "moderate" ? "0.03" : "0.05"},
  },
  positionSize: {
    max: ${p.maxPosition},
    riskPerTrade: 0.02,
  },
  feesBps: 5,
  slippageBps: 1,
  riskProfile: "${risk}",
};

// Strategy Logic
export function onTick(data) {
  // ${suggestion.description}
  const fast = indicators.EMA(data.close, config.indicators.fastPeriod);
  const slow = indicators.EMA(data.close, config.indicators.slowPeriod);
  const atr = indicators.ATR(data, config.indicators.atrPeriod);

  // Entry conditions
  if (fast > slow && !isLong) {
    const stopPrice = data.close - (atr * 2);
    const takeProfitPrice = data.close + (atr * 3);
    openLong({
      stop: stopPrice,
      target: takeProfitPrice,
    });
  }

  // Exit conditions
  if (fast < slow && isLong) {
    closeLong();
  }

  // Trailing stop
  if (isLong && config.exit.trailingStop) {
    updateTrailingStop(config.exit.trailingStop);
  }
}`;
}
