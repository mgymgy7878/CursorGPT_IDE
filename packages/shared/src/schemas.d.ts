import { z } from "zod";
export declare const BacktestParamsSchema: z.ZodObject<{
    symbol: z.ZodString;
    timeframe: z.ZodString;
    start: z.ZodNumber;
    end: z.ZodNumber;
    commission: z.ZodOptional<z.ZodNumber>;
    leverage: z.ZodOptional<z.ZodNumber>;
    barCount: z.ZodOptional<z.ZodNumber>;
    direction: z.ZodOptional<z.ZodEnum<["LONG", "SHORT", "BOTH"]>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timeframe: string;
    start: number;
    end: number;
    commission?: number | undefined;
    leverage?: number | undefined;
    barCount?: number | undefined;
    direction?: "LONG" | "SHORT" | "BOTH" | undefined;
}, {
    symbol: string;
    timeframe: string;
    start: number;
    end: number;
    commission?: number | undefined;
    leverage?: number | undefined;
    barCount?: number | undefined;
    direction?: "LONG" | "SHORT" | "BOTH" | undefined;
}>;
export declare const TradeSchema: z.ZodObject<{
    entryTime: z.ZodNumber;
    exitTime: z.ZodNumber;
    entryPrice: z.ZodNumber;
    exitPrice: z.ZodNumber;
    side: z.ZodEnum<["LONG", "SHORT"]>;
    qty: z.ZodNumber;
    pnl: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    entryTime: number;
    exitTime: number;
    entryPrice: number;
    exitPrice: number;
    side: "LONG" | "SHORT";
    qty: number;
    pnl: number;
}, {
    entryTime: number;
    exitTime: number;
    entryPrice: number;
    exitPrice: number;
    side: "LONG" | "SHORT";
    qty: number;
    pnl: number;
}>;
export declare const PointSchema: z.ZodObject<{
    time: z.ZodNumber;
    value: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    value: number;
    time: number;
}, {
    value: number;
    time: number;
}>;
export declare const BacktestResultSchema: z.ZodObject<{
    trades: z.ZodOptional<z.ZodArray<z.ZodObject<{
        entryTime: z.ZodNumber;
        exitTime: z.ZodNumber;
        entryPrice: z.ZodNumber;
        exitPrice: z.ZodNumber;
        side: z.ZodEnum<["LONG", "SHORT"]>;
        qty: z.ZodNumber;
        pnl: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        entryTime: number;
        exitTime: number;
        entryPrice: number;
        exitPrice: number;
        side: "LONG" | "SHORT";
        qty: number;
        pnl: number;
    }, {
        entryTime: number;
        exitTime: number;
        entryPrice: number;
        exitPrice: number;
        side: "LONG" | "SHORT";
        qty: number;
        pnl: number;
    }>, "many">>;
    totalPnl: z.ZodOptional<z.ZodNumber>;
    totalReturn: z.ZodOptional<z.ZodNumber>;
    maxDrawdown: z.ZodOptional<z.ZodNumber>;
    winRate: z.ZodOptional<z.ZodNumber>;
    sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sharpeRatio: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodArray<z.ZodObject<{
        time: z.ZodNumber;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: number;
        time: number;
    }, {
        value: number;
        time: number;
    }>, "many">>;
    equity: z.ZodOptional<z.ZodArray<z.ZodObject<{
        time: z.ZodNumber;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: number;
        time: number;
    }, {
        value: number;
        time: number;
    }>, "many">>;
    chartData: z.ZodOptional<z.ZodArray<z.ZodObject<{
        timestamp: z.ZodString;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        price: number;
        timestamp: string;
    }, {
        price: number;
        timestamp: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    trades?: {
        entryTime: number;
        exitTime: number;
        entryPrice: number;
        exitPrice: number;
        side: "LONG" | "SHORT";
        qty: number;
        pnl: number;
    }[] | undefined;
    totalPnl?: number | undefined;
    totalReturn?: number | undefined;
    maxDrawdown?: number | undefined;
    winRate?: number | undefined;
    sharpe?: number | null | undefined;
    sharpeRatio?: number | undefined;
    price?: {
        value: number;
        time: number;
    }[] | undefined;
    equity?: {
        value: number;
        time: number;
    }[] | undefined;
    chartData?: {
        price: number;
        timestamp: string;
    }[] | undefined;
}, {
    trades?: {
        entryTime: number;
        exitTime: number;
        entryPrice: number;
        exitPrice: number;
        side: "LONG" | "SHORT";
        qty: number;
        pnl: number;
    }[] | undefined;
    totalPnl?: number | undefined;
    totalReturn?: number | undefined;
    maxDrawdown?: number | undefined;
    winRate?: number | undefined;
    sharpe?: number | null | undefined;
    sharpeRatio?: number | undefined;
    price?: {
        value: number;
        time: number;
    }[] | undefined;
    equity?: {
        value: number;
        time: number;
    }[] | undefined;
    chartData?: {
        price: number;
        timestamp: string;
    }[] | undefined;
}>;
export declare const MarketDataParamsSchema: z.ZodObject<{
    symbol: z.ZodString;
    timeframe: z.ZodEnum<["1m", "5m", "15m", "1h", "4h", "1d"]>;
    start: z.ZodNumber;
    end: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
    start: number;
    end: number;
}, {
    symbol: string;
    timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
    start: number;
    end: number;
}>;
export type BacktestParams = z.infer<typeof BacktestParamsSchema>;
export type BacktestResult = z.infer<typeof BacktestResultSchema>;
export type MarketDataParams = z.infer<typeof MarketDataParamsSchema>;
export declare const OptimizeRangeSchema: z.ZodObject<{
    key: z.ZodString;
    min: z.ZodNumber;
    max: z.ZodNumber;
    step: z.ZodOptional<z.ZodNumber>;
    values: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    key: string;
    min: number;
    max: number;
    values?: number[] | undefined;
    step?: number | undefined;
}, {
    key: string;
    min: number;
    max: number;
    values?: number[] | undefined;
    step?: number | undefined;
}>;
export declare const OptimizeRequestSchema: z.ZodObject<{
    base: z.ZodObject<{
        symbol: z.ZodString;
        timeframe: z.ZodString;
        start: z.ZodNumber;
        end: z.ZodNumber;
        commission: z.ZodOptional<z.ZodNumber>;
        leverage: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        timeframe: string;
        start: number;
        end: number;
        commission?: number | undefined;
        leverage?: number | undefined;
    }, {
        symbol: string;
        timeframe: string;
        start: number;
        end: number;
        commission?: number | undefined;
        leverage?: number | undefined;
    }>;
    ranges: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        min: z.ZodNumber;
        max: z.ZodNumber;
        step: z.ZodOptional<z.ZodNumber>;
        values: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        key: string;
        min: number;
        max: number;
        values?: number[] | undefined;
        step?: number | undefined;
    }, {
        key: string;
        min: number;
        max: number;
        values?: number[] | undefined;
        step?: number | undefined;
    }>, "many">;
    method: z.ZodDefault<z.ZodEnum<["grid", "random"]>>;
    maxSamples: z.ZodDefault<z.ZodNumber>;
    oosPercent: z.ZodDefault<z.ZodNumber>;
    target: z.ZodDefault<z.ZodEnum<["totalPnl", "sharpe", "winRate", "maxDrawdown"]>>;
    direction: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    strategyId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    direction: "asc" | "desc";
    base: {
        symbol: string;
        timeframe: string;
        start: number;
        end: number;
        commission?: number | undefined;
        leverage?: number | undefined;
    };
    ranges: {
        key: string;
        min: number;
        max: number;
        values?: number[] | undefined;
        step?: number | undefined;
    }[];
    method: "grid" | "random";
    maxSamples: number;
    oosPercent: number;
    target: "totalPnl" | "maxDrawdown" | "winRate" | "sharpe";
    strategyId?: string | undefined;
}, {
    base: {
        symbol: string;
        timeframe: string;
        start: number;
        end: number;
        commission?: number | undefined;
        leverage?: number | undefined;
    };
    ranges: {
        key: string;
        min: number;
        max: number;
        values?: number[] | undefined;
        step?: number | undefined;
    }[];
    direction?: "asc" | "desc" | undefined;
    method?: "grid" | "random" | undefined;
    maxSamples?: number | undefined;
    oosPercent?: number | undefined;
    target?: "totalPnl" | "maxDrawdown" | "winRate" | "sharpe" | undefined;
    strategyId?: string | undefined;
}>;
export declare const OptimizeSampleSchema: z.ZodObject<{
    params: z.ZodRecord<z.ZodString, z.ZodNumber>;
    score: z.ZodNumber;
    inSample: z.ZodObject<{
        totalPnl: z.ZodNumber;
        maxDrawdown: z.ZodNumber;
        winRate: z.ZodNumber;
        sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    }, {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    }>;
    outSample: z.ZodOptional<z.ZodObject<{
        totalPnl: z.ZodNumber;
        maxDrawdown: z.ZodNumber;
        winRate: z.ZodNumber;
        sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    }, {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    params: Record<string, number>;
    score: number;
    inSample: {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    };
    outSample?: {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    } | undefined;
}, {
    params: Record<string, number>;
    score: number;
    inSample: {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    };
    outSample?: {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    } | undefined;
}>;
export declare const OptimizeResultSchema: z.ZodObject<{
    runId: z.ZodString;
    total: z.ZodNumber;
    samples: z.ZodArray<z.ZodObject<{
        params: z.ZodRecord<z.ZodString, z.ZodNumber>;
        score: z.ZodNumber;
        inSample: z.ZodObject<{
            totalPnl: z.ZodNumber;
            maxDrawdown: z.ZodNumber;
            winRate: z.ZodNumber;
            sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }>;
        outSample: z.ZodOptional<z.ZodObject<{
            totalPnl: z.ZodNumber;
            maxDrawdown: z.ZodNumber;
            winRate: z.ZodNumber;
            sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        params: Record<string, number>;
        score: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        outSample?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }, {
        params: Record<string, number>;
        score: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        outSample?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }>, "many">;
    best: z.ZodOptional<z.ZodObject<{
        params: z.ZodRecord<z.ZodString, z.ZodNumber>;
        score: z.ZodNumber;
        inSample: z.ZodObject<{
            totalPnl: z.ZodNumber;
            maxDrawdown: z.ZodNumber;
            winRate: z.ZodNumber;
            sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }>;
        outSample: z.ZodOptional<z.ZodObject<{
            totalPnl: z.ZodNumber;
            maxDrawdown: z.ZodNumber;
            winRate: z.ZodNumber;
            sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        params: Record<string, number>;
        score: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        outSample?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }, {
        params: Record<string, number>;
        score: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        outSample?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    runId: string;
    total: number;
    samples: {
        params: Record<string, number>;
        score: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        outSample?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }[];
    best?: {
        params: Record<string, number>;
        score: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        outSample?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    } | undefined;
}, {
    runId: string;
    total: number;
    samples: {
        params: Record<string, number>;
        score: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        outSample?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }[];
    best?: {
        params: Record<string, number>;
        score: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        outSample?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    } | undefined;
}>;
export type OptimizeRequest = z.infer<typeof OptimizeRequestSchema>;
export type OptimizeResult = z.infer<typeof OptimizeResultSchema>;
export declare const WalkForwardRequestSchema: z.ZodObject<{
    base: z.ZodObject<{
        symbol: z.ZodString;
        timeframe: z.ZodString;
        start: z.ZodNumber;
        end: z.ZodNumber;
        commission: z.ZodOptional<z.ZodNumber>;
        leverage: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        timeframe: string;
        start: number;
        end: number;
        commission?: number | undefined;
        leverage?: number | undefined;
    }, {
        symbol: string;
        timeframe: string;
        start: number;
        end: number;
        commission?: number | undefined;
        leverage?: number | undefined;
    }>;
    params: z.ZodRecord<z.ZodString, z.ZodNumber>;
    windowPct: z.ZodNumber;
    stepPct: z.ZodNumber;
    oosPct: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    params: Record<string, number>;
    base: {
        symbol: string;
        timeframe: string;
        start: number;
        end: number;
        commission?: number | undefined;
        leverage?: number | undefined;
    };
    windowPct: number;
    stepPct: number;
    oosPct: number;
}, {
    params: Record<string, number>;
    base: {
        symbol: string;
        timeframe: string;
        start: number;
        end: number;
        commission?: number | undefined;
        leverage?: number | undefined;
    };
    windowPct: number;
    stepPct: number;
    oosPct?: number | undefined;
}>;
export declare const WalkWindowSchema: z.ZodObject<{
    idx: z.ZodNumber;
    start: z.ZodNumber;
    end: z.ZodNumber;
    inSample: z.ZodObject<{
        totalPnl: z.ZodNumber;
        maxDrawdown: z.ZodNumber;
        winRate: z.ZodNumber;
        sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    }, {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    }>;
    oos: z.ZodOptional<z.ZodObject<{
        totalPnl: z.ZodNumber;
        maxDrawdown: z.ZodNumber;
        winRate: z.ZodNumber;
        sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    }, {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    start: number;
    end: number;
    inSample: {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    };
    idx: number;
    oos?: {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    } | undefined;
}, {
    start: number;
    end: number;
    inSample: {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    };
    idx: number;
    oos?: {
        totalPnl: number;
        maxDrawdown: number;
        winRate: number;
        sharpe?: number | null | undefined;
    } | undefined;
}>;
export declare const WalkForwardResultSchema: z.ZodObject<{
    runId: z.ZodString;
    windows: z.ZodArray<z.ZodObject<{
        idx: z.ZodNumber;
        start: z.ZodNumber;
        end: z.ZodNumber;
        inSample: z.ZodObject<{
            totalPnl: z.ZodNumber;
            maxDrawdown: z.ZodNumber;
            winRate: z.ZodNumber;
            sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }>;
        oos: z.ZodOptional<z.ZodObject<{
            totalPnl: z.ZodNumber;
            maxDrawdown: z.ZodNumber;
            winRate: z.ZodNumber;
            sharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }, {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        start: number;
        end: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        idx: number;
        oos?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }, {
        start: number;
        end: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        idx: number;
        oos?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }>, "many">;
    summary: z.ZodObject<{
        avgSharpe: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        avgReturn: z.ZodOptional<z.ZodNumber>;
        totalWindows: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalWindows: number;
        avgSharpe?: number | null | undefined;
        avgReturn?: number | undefined;
    }, {
        totalWindows: number;
        avgSharpe?: number | null | undefined;
        avgReturn?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    runId: string;
    windows: {
        start: number;
        end: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        idx: number;
        oos?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }[];
    summary: {
        totalWindows: number;
        avgSharpe?: number | null | undefined;
        avgReturn?: number | undefined;
    };
}, {
    runId: string;
    windows: {
        start: number;
        end: number;
        inSample: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        };
        idx: number;
        oos?: {
            totalPnl: number;
            maxDrawdown: number;
            winRate: number;
            sharpe?: number | null | undefined;
        } | undefined;
    }[];
    summary: {
        totalWindows: number;
        avgSharpe?: number | null | undefined;
        avgReturn?: number | undefined;
    };
}>;
export type WalkForwardRequest = z.infer<typeof WalkForwardRequestSchema>;
export type WalkForwardResult = z.infer<typeof WalkForwardResultSchema>;
//# sourceMappingURL=schemas.d.ts.map