export * from "./client.js";
export * from "./websocket.js";
export * from "./types.js";
export declare const binance: {
    version: string;
    description: string;
};
export declare function getTestnetClient(): Promise<{
    placeMarketOrder: ({ symbol, qty, side }: {
        symbol: string;
        qty: number;
        side: string;
    }) => Promise<{
        id: string;
        status: string;
    }>;
}>;
//# sourceMappingURL=index.d.ts.map