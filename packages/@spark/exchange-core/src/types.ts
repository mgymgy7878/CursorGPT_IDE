export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "LIMIT_MAKER" | "STOP" | "STOP_LIMIT";

export interface PlaceOrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: string;
  price?: string;
  timeInForce?: "GTC"|"IOC"|"FOK";
  newClientOrderId?: string;
  // Day-7 additions:
  icebergQty?: string;     // native iceberg (Binance)
}

export interface ExchangeCapabilities {
  nativeIceberg: boolean;
  supportsReplace: boolean;
  cancelAllRequiresSymbol: boolean;
}

export interface PrivateExchange {
  capabilities(): ExchangeCapabilities;
  newOrder(p: PlaceOrderParams): Promise<any>;
  cancelOrder(p: {symbol:string; orderId?: string; origClientOrderId?: string;}): Promise<any>;
  cancelAllOpenOrders(p: {symbol:string}): Promise<any>;
  openOrders(p?: {symbol?:string}): Promise<any>;
  account(): Promise<any>;
} 