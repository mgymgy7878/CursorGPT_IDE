export declare function getTestnetClient(): Promise<{
    placeMarketOrder({ symbol, qty, side }: {
        symbol: string;
        qty: number;
        side: "BUY" | "SELL";
    }): Promise<{
        id: string;
        symbol: string;
        qty: number;
        side: "BUY" | "SELL";
        status: "SIMULATED";
    }>;
}>;
declare const _default: {
    getTestnetClient: typeof getTestnetClient;
};
export default _default;
//# sourceMappingURL=index.d.ts.map