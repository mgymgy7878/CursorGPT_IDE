import { BTCTurkConfig, BTCTurkSymbol, BTCTurkTicker, BTCTurkTrade, BTCTurkOrderBook, BTCTurkKline, BTCTurkAccount, BTCTurkOrder } from './types.js';
export declare class BTCTurkRESTClient {
    private config;
    private baseUrl;
    private timeout;
    constructor(config: BTCTurkConfig);
    private makeRequest;
    getServerTime(): Promise<number>;
    getSymbols(): Promise<BTCTurkSymbol[]>;
    getTicker(symbol?: string): Promise<BTCTurkTicker | BTCTurkTicker[]>;
    getTrades(symbol: string, limit?: number): Promise<BTCTurkTrade[]>;
    getOrderBook(symbol: string, limit?: number): Promise<BTCTurkOrderBook>;
    getKlines(symbol: string, interval?: string, startTime?: number, endTime?: number, limit?: number): Promise<BTCTurkKline[]>;
    getAccount(): Promise<BTCTurkAccount[]>;
    getOpenOrders(symbol?: string): Promise<BTCTurkOrder[]>;
    placeOrder(order: {
        symbol: string;
        side: 'BUY' | 'SELL';
        type: 'MARKET' | 'LIMIT';
        quantity: string;
        price?: string;
        timeInForce?: 'GTC' | 'IOC' | 'FOK';
        clientOrderId?: string;
    }): Promise<BTCTurkOrder>;
    cancelOrder(symbol: string, orderId: string): Promise<{
        orderId: string;
        status: string;
    }>;
    getOrder(symbol: string, orderId: string): Promise<BTCTurkOrder>;
}
//# sourceMappingURL=rest-client.d.ts.map