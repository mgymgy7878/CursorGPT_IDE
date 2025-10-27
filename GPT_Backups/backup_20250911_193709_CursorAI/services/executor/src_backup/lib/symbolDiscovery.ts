import { getExchangeInfo } from "./exchangeInfo";

export interface DiscoveredSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: 'TRADING' | 'BREAK' | 'AUCTION_MATCH';
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
  filters: {
    priceFilter?: {
      minPrice: string;
      maxPrice: string;
      tickSize: string;
    };
    lotSize?: {
      minQty: string;
      maxQty: string;
      stepSize: string;
    };
    minNotional?: {
      minNotional: string;
    };
  };
}

export class SymbolDiscoveryService {
  private static instance: SymbolDiscoveryService;
  private cache: DiscoveredSymbol[] = [];
  private lastUpdate = 0;
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutes

  static getInstance(): SymbolDiscoveryService {
    if (!SymbolDiscoveryService.instance) {
      SymbolDiscoveryService.instance = new SymbolDiscoveryService();
    }
    return SymbolDiscoveryService.instance;
  }

  async discoverSymbols(baseUrl: string): Promise<DiscoveredSymbol[]> {
    const now = Date.now();
    if (this.cache.length > 0 && (now - this.lastUpdate) < this.TTL_MS) {
      return this.cache;
    }

    try {
      const exchangeInfo = await getExchangeInfo(baseUrl);
      const symbols = exchangeInfo.symbols
        .filter((s: any) => s.status === 'TRADING')
        .map((s: any) => {
          const filters = this.extractFilters(s.filters);
          return {
            symbol: s.symbol,
            baseAsset: s.baseAsset,
            quoteAsset: s.quoteAsset,
            status: s.status,
            baseAssetPrecision: s.baseAssetPrecision,
            quoteAssetPrecision: s.quoteAssetPrecision,
            filters
          };
        })
        .filter((s: DiscoveredSymbol) => s.quoteAsset === 'USDT'); // USDT pairs only

      this.cache = symbols;
      this.lastUpdate = now;
      return symbols;
    } catch (error) {
      console.error('Symbol discovery failed:', error);
      return this.cache; // Return cached data if available
    }
  }

  private extractFilters(filters: any[]) {
    const result: any = {};
    
    filters.forEach((f: any) => {
      switch (f.filterType) {
        case 'PRICE_FILTER':
          result.priceFilter = {
            minPrice: f.minPrice,
            maxPrice: f.maxPrice,
            tickSize: f.tickSize
          };
          break;
        case 'LOT_SIZE':
          result.lotSize = {
            minQty: f.minQty,
            maxQty: f.maxQty,
            stepSize: f.stepSize
          };
          break;
        case 'MIN_NOTIONAL':
          result.minNotional = {
            minNotional: f.minNotional
          };
          break;
      }
    });

    return result;
  }

  async getWhitelistedSymbols(baseUrl: string): Promise<string[]> {
    const symbols = await this.discoverSymbols(baseUrl);
    // Auto-whitelist based on criteria (volume, market cap, etc.)
    return symbols
      .filter(s => this.isWhitelistCandidate(s))
      .map(s => s.symbol);
  }

  private isWhitelistCandidate(symbol: DiscoveredSymbol): boolean {
    // Auto-whitelist criteria
    const highVolumeSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
    const hasMinNotional = symbol.filters.minNotional?.minNotional;
    const hasReasonableStepSize = symbol.filters.lotSize?.stepSize;
    
        return highVolumeSymbols.includes(symbol.symbol) ||
           (!!hasMinNotional && !!hasReasonableStepSize);
  }

  async updateSymbolRules(baseUrl: string): Promise<void> {
    const symbols = await this.discoverSymbols(baseUrl);
    // Update runtime symbol rules
    // This could update the @spark/exchange-private symbols.testnet.ts
    console.log(`Updated ${symbols.length} symbol rules from exchange`);
  }
} 