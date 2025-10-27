export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type TradeSide = 'BUY' | 'SELL' | 'FLAT';
export interface Bar {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}
export interface Metrics {
    totalReturn: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    sharpeRatio: number;
}
//# sourceMappingURL=types.d.ts.map