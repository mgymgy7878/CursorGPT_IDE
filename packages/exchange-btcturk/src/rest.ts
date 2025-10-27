// BTCTurk REST API Client
import { sign } from "./signer.js";

export class BTCTurkRestClient {
  private baseUrl = "https://api.btcturk.com/api/v2";
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  async getTicker(symbol: string) {
    // TODO: Implement ticker endpoint
    console.log(`Getting ticker for ${symbol}`);
    return { symbol, price: 0, volume: 0 };
  }

  async getOrderBook(symbol: string) {
    // TODO: Implement orderbook endpoint
    console.log(`Getting orderbook for ${symbol}`);
    return { symbol, bids: [], asks: [] };
  }

  async placeOrder(orderData: any) {
    const timestamp = Date.now();
    const payload = JSON.stringify(orderData);
    const signature = sign(payload, this.secretKey);
    
    // TODO: Implement place order with signature
    console.log(`Placing order: ${payload}`);
    return { 
      orderId: "test-" + timestamp,
      status: "ok",
      timestamp 
    };
  }

  async cancelOrder(orderId: string) {
    const timestamp = Date.now();
    const payload = JSON.stringify({ orderId });
    const signature = sign(payload, this.secretKey);
    
    // TODO: Implement cancel order with signature
    console.log(`Canceling order: ${orderId}`);
    return { 
      orderId,
      status: "ok",
      timestamp 
    };
  }

  async getBalances() {
    const timestamp = Date.now();
    const payload = "";
    const signature = sign(payload, this.secretKey);
    
    // TODO: Implement get balances with signature
    console.log("Getting balances");
    return { 
      balances: [],
      timestamp 
    };
  }
} 