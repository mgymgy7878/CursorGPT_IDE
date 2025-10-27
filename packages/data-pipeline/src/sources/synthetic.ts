// Synthetic Data Source
import type { Symbol } from "@spark/types";

export class SyntheticDataSource {
  async generateData(symbol: Symbol, count: number = 100) {
    // TODO: Implement synthetic data generation
    return Array.from({ length: count }, (_, i) => ({
      symbol,
      price: 100 + Math.random() * 10,
      volume: Math.random() * 1000,
      timestamp: Date.now() - (count - i) * 60000
    }));
  }
}

export async function generateBTCUSDT24h(){
	const s = new SyntheticDataSource();
	return s.generateData('BTCUSDT' as unknown as Symbol, 24*60);
} 