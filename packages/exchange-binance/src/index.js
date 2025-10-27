// Binance Exchange Integration
export * from "./client.js";
export * from "./websocket.js";
export * from "./types.js";
export const binance = {
    version: "0.1.0",
    description: "Binance exchange integration"
};
// Testnet client export
export async function getTestnetClient() {
    return {
        placeMarketOrder: async ({ symbol, qty, side }) => ({
            id: `testnet-${Date.now()}`,
            status: 'NEW'
        })
    };
}
// Auto-generated barrel exports
// removed accidental absolute barrel entries
//# sourceMappingURL=index.js.map