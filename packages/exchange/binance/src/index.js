export async function getTestnetClient() {
    return {
        async placeMarketOrder({ symbol, qty, side }) {
            return { id: `SIM-${Date.now()}`, symbol, qty, side, status: "SIMULATED" };
        }
    };
}
export default { getTestnetClient };
//# sourceMappingURL=index.js.map