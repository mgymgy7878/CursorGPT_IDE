// Simple Binance types without external dependencies
export interface BinanceOrder {
  symbol: string;
  orderId: string;
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED';
}

export interface BinanceTrade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  timestamp: number;
} 