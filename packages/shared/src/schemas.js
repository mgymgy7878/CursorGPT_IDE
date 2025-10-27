import { z } from "zod";
export const BacktestParamsSchema = z.object({
    symbol: z.string().min(1),
    timeframe: z.string().min(1),
    start: z.number().int(), // epoch ms
    end: z.number().int(), // epoch ms
    commission: z.number().nonnegative().optional(),
    leverage: z.number().positive().optional(),
    barCount: z.number().int().positive().optional(),
    direction: z.enum(['LONG', 'SHORT', 'BOTH']).optional()
});
export const TradeSchema = z.object({
    entryTime: z.number(),
    exitTime: z.number(),
    entryPrice: z.number(),
    exitPrice: z.number(),
    side: z.enum(['LONG', 'SHORT']),
    qty: z.number(),
    pnl: z.number()
});
export const PointSchema = z.object({ time: z.number(), value: z.number() });
// Esnek sonuç: mevcut stub ile uyum için alanları opsiyonel bırakıyoruz
export const BacktestResultSchema = z.object({
    trades: z.array(TradeSchema).optional(),
    totalPnl: z.number().optional(),
    totalReturn: z.number().optional(),
    maxDrawdown: z.number().optional(),
    winRate: z.number().optional(),
    sharpe: z.number().nullable().optional(),
    sharpeRatio: z.number().optional(),
    price: z.array(PointSchema).optional(),
    equity: z.array(PointSchema).optional(),
    chartData: z.array(z.object({ timestamp: z.string(), price: z.number() })).optional(),
    // mevcut stub ile uyum
});
export const MarketDataParamsSchema = z.object({
    symbol: z.string().min(1),
    timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
    start: z.number().int(),
    end: z.number().int()
});
// Param aralığı (sadece sayısal)
export const OptimizeRangeSchema = z.object({
    key: z.string().min(1),
    min: z.number(),
    max: z.number(),
    step: z.number().positive().optional(),
    values: z.array(z.number()).optional()
});
// İstek
export const OptimizeRequestSchema = z.object({
    base: z.object({
        symbol: z.string().min(1),
        timeframe: z.string().min(1),
        start: z.number().int(),
        end: z.number().int(),
        commission: z.number().nonnegative().optional(),
        leverage: z.number().positive().optional()
    }),
    ranges: z.array(OptimizeRangeSchema).min(1),
    method: z.enum(['grid', 'random']).default('grid'),
    maxSamples: z.number().int().positive().max(5000).default(200),
    oosPercent: z.number().min(0).max(0.9).default(0.2),
    target: z.enum(['totalPnl', 'sharpe', 'winRate', 'maxDrawdown']).default('totalPnl'),
    direction: z.enum(['asc', 'desc']).default('desc'),
    strategyId: z.string().optional()
});
export const OptimizeSampleSchema = z.object({
    params: z.record(z.number()),
    score: z.number(),
    inSample: z.object({
        totalPnl: z.number(),
        maxDrawdown: z.number(),
        winRate: z.number(),
        sharpe: z.number().nullable().optional()
    }),
    outSample: z.object({
        totalPnl: z.number(),
        maxDrawdown: z.number(),
        winRate: z.number(),
        sharpe: z.number().nullable().optional()
    }).optional()
});
export const OptimizeResultSchema = z.object({
    runId: z.string(),
    total: z.number().int().positive(),
    samples: z.array(OptimizeSampleSchema),
    best: OptimizeSampleSchema.optional()
});
// Walk-Forward
export const WalkForwardRequestSchema = z.object({
    base: z.object({
        symbol: z.string().min(1),
        timeframe: z.string().min(1),
        start: z.number().int(),
        end: z.number().int(),
        commission: z.number().nonnegative().optional(),
        leverage: z.number().positive().optional()
    }),
    params: z.record(z.number()),
    windowPct: z.number().min(0.05).max(0.95),
    stepPct: z.number().min(0.01).max(0.95),
    oosPct: z.number().min(0).max(0.9).default(0.2)
});
export const WalkWindowSchema = z.object({
    idx: z.number().int(),
    start: z.number().int(),
    end: z.number().int(),
    inSample: z.object({
        totalPnl: z.number(),
        maxDrawdown: z.number(),
        winRate: z.number(),
        sharpe: z.number().nullable().optional()
    }),
    oos: z.object({
        totalPnl: z.number(),
        maxDrawdown: z.number(),
        winRate: z.number(),
        sharpe: z.number().nullable().optional()
    }).optional()
});
export const WalkForwardResultSchema = z.object({
    runId: z.string(),
    windows: z.array(WalkWindowSchema),
    summary: z.object({
        avgSharpe: z.number().nullable().optional(),
        avgReturn: z.number().optional(),
        totalWindows: z.number().int().positive()
    })
});
