import { z } from "zod";

export const StrategySchema = z.object({
  version: z.string().default("v1"),
  name: z.string().min(1, "Strateji adı gerekli"),
  params: z.record(
    z.union([z.string(), z.number(), z.boolean()])
  ).default({}),
  risk: z.object({
    maxDrawdown: z.number().min(0).max(0.5).default(0.1),
    maxNotional: z.number().min(0).default(1000),
    leverage: z.number().min(1).max(125).default(1),
    notionalPct: z.number().min(0).max(1).default(0.1)
  }).optional(),
  entries: z.array(z.object({
    when: z.string().min(1, "Giriş koşulu gerekli"),
    side: z.enum(["BUY", "SELL"]),
    confidence: z.number().min(0).max(1).default(0.5)
  })).default([]),
  exits: z.object({
    tpPct: z.number().min(0).max(1).default(0.02),
    slPct: z.number().min(0).max(1).default(0.01),
    trailingStop: z.boolean().default(false)
  }).optional(),
  filters: z.array(z.object({
    type: z.string(),
    minVolume: z.number().optional(),
    maxSpread: z.number().optional()
  })).default([])
});

export type StrategyT = z.infer<typeof StrategySchema>;

// Strateji şablonları
export const StrategyTemplates = {
  rsiMacd: {
    version: "v1",
    name: "RSI + MACD Strategy",
    params: {
      rsiLength: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9
    },
    risk: {
      maxDrawdown: 0.1,
      maxNotional: 1000,
      leverage: 3,
      notionalPct: 0.2
    },
    entries: [
      {
        when: "rsi < rsiOversold && macd > signal",
        side: "BUY" as const,
        confidence: 0.8
      }
    ],
    exits: {
      tpPct: 0.02,
      slPct: 0.01,
      trailingStop: true
    },
    filters: [
      {
        type: "volume",
        minVolume: 1000000
      }
    ]
  },
  
  emaCrossover: {
    version: "v1",
    name: "EMA Crossover Strategy",
    params: {
      emaFast: 9,
      emaSlow: 21,
      volumeThreshold: 1000000
    },
    risk: {
      maxDrawdown: 0.15,
      maxNotional: 2000,
      leverage: 2,
      notionalPct: 0.15
    },
    entries: [
      {
        when: "emaFast > emaSlow && volume > volumeThreshold",
        side: "BUY" as const,
        confidence: 0.7
      }
    ],
    exits: {
      tpPct: 0.03,
      slPct: 0.015,
      trailingStop: false
    },
    filters: []
  },

  meanReversion: {
    version: "v1",
    name: "Mean Reversion Strategy",
    params: {
      bbPeriod: 20,
      bbStdDev: 2,
      rsiPeriod: 14,
      rsiOversold: 30,
      rsiOverbought: 70
    },
    risk: {
      maxDrawdown: 0.08,
      maxNotional: 1500,
      leverage: 1,
      notionalPct: 0.1
    },
    entries: [
      {
        when: "price < bbLower && rsi < rsiOversold",
        side: "BUY" as const,
        confidence: 0.75
      }
    ],
    exits: {
      tpPct: 0.015,
      slPct: 0.008,
      trailingStop: true
    },
    filters: []
  }
};


