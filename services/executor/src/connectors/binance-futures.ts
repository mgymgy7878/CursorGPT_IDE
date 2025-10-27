// services/executor/src/connectors/binance-futures.ts
import crypto from "node:crypto";

export type FuturesOrderSide = "BUY" | "SELL";
export type FuturesOrderType = "MARKET" | "LIMIT" | "STOP_MARKET" | "STOP_LIMIT";
export type FuturesPositionSide = "BOTH" | "LONG" | "SHORT";

export interface FuturesOrderRequest {
  symbol: string;
  side: FuturesOrderSide;
  type: FuturesOrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: "GTC" | "IOC" | "FOK";
  positionSide?: FuturesPositionSide;
  dryRun?: boolean;
}

export interface FuturesPosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  marginType: string;
  isolatedMargin: string;
  positionSide: string;
}

export interface FuturesAccountInfo {
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  totalMarginBalance: string;
  availableBalance: string;
  maxWithdrawAmount: string;
}

/**
 * Binance Futures REST API Connector
 * Supports both testnet and production environments
 */
export class BinanceFutures {
  private readonly baseUrl: string;
  
  constructor(
    private readonly apiKey?: string,
    private readonly apiSecret?: string,
    private readonly testnet: boolean = true
  ) {
    this.baseUrl = testnet 
      ? "https://testnet.binancefuture.com" 
      : "https://fapi.binance.com";
    
    console.log(`[BinanceFutures] Initialized ${testnet ? 'TESTNET' : 'PRODUCTION'} mode`);
  }

  /**
   * Generate HMAC SHA256 signature for signed endpoints
   */
  private sign(queryString: string): string {
    if (!this.apiSecret) {
      throw new Error('API secret is required for signed endpoints');
    }
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(queryString)
      .digest("hex");
  }

  /**
   * Make HTTP request to Binance Futures API
   */
  private async request(
    path: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    params: Record<string, any> = {},
    signed: boolean = false
  ): Promise<any> {
    const query = new URLSearchParams();
    
    // Add parameters
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }

    // Add signature if required
    if (signed) {
      query.set("timestamp", String(Date.now()));
      if (process.env.BINANCE_RECV_WINDOW) {
        query.set("recvWindow", process.env.BINANCE_RECV_WINDOW);
      }
      query.set("signature", this.sign(query.toString()));
    }

    const url = `${this.baseUrl}${path}?${query.toString()}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey && signed) {
      headers["X-MBX-APIKEY"] = this.apiKey;
    }

    const response = await fetch(url, { method, headers });
    const data = await response.json();

    if (!response.ok) {
      throw Object.assign(new Error("binance_futures_error"), {
        status: response.status,
        code: (data as any).code,
        msg: (data as any).msg,
        body: data,
      });
    }

    return data;
  }

  /**
   * Get server time
   */
  async serverTime(): Promise<{ serverTime: number }> {
    return this.request("/fapi/v1/time");
  }

  /**
   * Get account information (balance, leverage, etc.)
   */
  async getAccount(): Promise<FuturesAccountInfo> {
    return this.request("/fapi/v2/account", "GET", {}, true);
  }

  /**
   * Get all open positions
   */
  async getPositions(symbol?: string): Promise<FuturesPosition[]> {
    const params = symbol ? { symbol } : {};
    return this.request("/fapi/v2/positionRisk", "GET", params, true);
  }

  /**
   * Get open orders
   */
  async getOpenOrders(symbol?: string): Promise<any[]> {
    const params = symbol ? { symbol } : {};
    return this.request("/fapi/v1/openOrders", "GET", params, true);
  }

  /**
   * Place a new order
   * @param req Order request
   * @returns Order response or dry-run simulation
   */
  async placeOrder(req: FuturesOrderRequest): Promise<any> {
    // Dry-run mode (default)
    if (req.dryRun !== false) {
      console.log("[BinanceFutures] DRY-RUN order:", req);
      return {
        dryRun: true,
        ack: true,
        simulated: true,
        echo: req,
        timestamp: Date.now(),
      };
    }

    // Real order placement
    const params: Record<string, any> = {
      symbol: req.symbol,
      side: req.side,
      type: req.type,
      quantity: req.quantity,
    };

    if (req.price) params.price = req.price;
    if (req.stopPrice) params.stopPrice = req.stopPrice;
    if (req.timeInForce) params.timeInForce = req.timeInForce;
    if (req.positionSide) params.positionSide = req.positionSide;

    return this.request("/fapi/v1/order", "POST", params, true);
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    return this.request(
      "/fapi/v1/order",
      "DELETE",
      { symbol, orderId },
      true
    );
  }

  /**
   * Cancel all open orders for a symbol
   */
  async cancelAllOrders(symbol: string): Promise<any> {
    return this.request(
      "/fapi/v1/allOpenOrders",
      "DELETE",
      { symbol },
      true
    );
  }

  /**
   * Get order status
   */
  async getOrder(symbol: string, orderId: number): Promise<any> {
    return this.request(
      "/fapi/v1/order",
      "GET",
      { symbol, orderId },
      true
    );
  }

  /**
   * Change leverage for a symbol
   */
  async changeLeverage(symbol: string, leverage: number): Promise<any> {
    return this.request(
      "/fapi/v1/leverage",
      "POST",
      { symbol, leverage },
      true
    );
  }

  /**
   * Change margin type (ISOLATED or CROSSED)
   */
  async changeMarginType(symbol: string, marginType: "ISOLATED" | "CROSSED"): Promise<any> {
    return this.request(
      "/fapi/v1/marginType",
      "POST",
      { symbol, marginType },
      true
    );
  }
}

