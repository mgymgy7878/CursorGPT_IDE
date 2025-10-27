export * from './types.js';
export * from './rest-client.js';
export * from './ws-client.js';
import { BTCTurkConfig, BTCTurkMetrics } from './types.js';
export declare class BTCTurkExchange {
    private restClient;
    private wsClient;
    private metrics;
    constructor(config: BTCTurkConfig);
    private setupEventHandlers;
    getServerTime(): Promise<number>;
    getSymbols(): Promise<import("./types.js").BTCTurkSymbol[]>;
    getTicker(symbol?: string): Promise<import("./types.js").BTCTurkTicker | import("./types.js").BTCTurkTicker[]>;
    getTrades(symbol: string, limit?: number): Promise<import("./types.js").BTCTurkTrade[]>;
    getOrderBook(symbol: string, limit?: number): Promise<import("./types.js").BTCTurkOrderBook>;
    getKlines(symbol: string, interval?: string, startTime?: number, endTime?: number, limit?: number): Promise<import("./types.js").BTCTurkKline[]>;
    getAccount(): Promise<import("./types.js").BTCTurkAccount[]>;
    getOpenOrders(symbol?: string): Promise<import("./types.js").BTCTurkOrder[]>;
    placeOrder(order: any): Promise<import("./types.js").BTCTurkOrder>;
    cancelOrder(symbol: string, orderId: string): Promise<{
        orderId: string;
        status: string;
    }>;
    getOrder(symbol: string, orderId: string): Promise<import("./types.js").BTCTurkOrder>;
    connectWS(): Promise<void>;
    subscribeTicker(symbol: string): void;
    subscribeTrades(symbol: string): void;
    subscribeOrderBook(symbol: string): void;
    unsubscribe(channel: string): void;
    disconnectWS(): void;
    getWSStatus(): {
        connected: boolean;
        channels: string[];
    };
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    getMetrics(): BTCTurkMetrics;
    healthCheck(): Promise<{
        status: string;
        metrics: BTCTurkMetrics;
        wsStatus: any;
    }>;
}
//# sourceMappingURL=index.d.ts.map