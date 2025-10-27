export declare class BinanceClient {
    private apiKey;
    private apiSecret;
    private baseUrl;
    constructor(apiKey: string, apiSecret: string, testnet?: boolean);
    getAccountInfo(): Promise<{
        status: string;
    }>;
    placeOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, price?: number): Promise<{
        orderId: string;
    }>;
}
//# sourceMappingURL=client.d.ts.map