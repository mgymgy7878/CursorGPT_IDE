export async function getTestnetClient() {
  return {
    async placeMarketOrder({ symbol, qty, side }:{symbol:string; qty:number; side:"BUY"|"SELL"}) {
      return { id: `SIM-${Date.now()}`, symbol, qty, side, status: "SIMULATED" as const };
    }
  };
}
export default { getTestnetClient }; 