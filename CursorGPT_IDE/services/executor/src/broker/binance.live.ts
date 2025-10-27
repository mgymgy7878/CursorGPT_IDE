import crypto from "crypto";

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  qty: number;
  price?: number;
  clientOrderId?: string;
}

export interface OrderResponse {
  orderId: string;
  clientOrderId: string;
  symbol: string;
  side: string;
  type: string;
  qty: number;
  price?: number;
  status: string;
  fills?: Array<{
    qty: number;
    price: number;
    commission: number;
  }>;
}

export interface AccountInfo {
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
}

export interface TickerInfo {
  symbol: string;
  price: string;
  volume: string;
}

const BASE_URL = 'https://api.binance.com';
const API_KEY = process.env.BINANCE_MAINNET_API_KEY || '';
const API_SECRET = process.env.BINANCE_MAINNET_API_SECRET || '';

function sign(query: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(query).digest('hex');
}

async function makeRequest(endpoint: string, params: Record<string, any> = {}, method: 'GET' | 'POST' | 'DELETE' = 'GET'): Promise<any> {
  const timestamp = Date.now();
  const recvWindow = 5000;
  
  const queryParams = new URLSearchParams({
    ...params,
    timestamp: timestamp.toString(),
    recvWindow: recvWindow.toString()
  });

  const signature = sign(queryParams.toString(), API_SECRET);
  queryParams.append('signature', signature);

  const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'X-MBX-APIKEY': API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Binance API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function placeOrder(request: OrderRequest): Promise<OrderResponse> {
  const params: Record<string, any> = {
    symbol: request.symbol,
    side: request.side,
    type: request.type,
    quantity: request.qty.toString()
  };

  if (request.price) {
    params.price = request.price.toString();
  }

  if (request.clientOrderId) {
    params.newClientOrderId = request.clientOrderId;
  }

  const result = await makeRequest('/api/v3/order', params, 'POST');
  
  return {
    orderId: result.orderId.toString(),
    clientOrderId: result.clientOrderId || request.clientOrderId || '',
    symbol: result.symbol,
    side: result.side,
    type: result.type,
    qty: parseFloat(result.origQty),
    price: result.price ? parseFloat(result.price) : undefined,
    status: result.status,
    fills: result.fills?.map((fill: any) => ({
      qty: parseFloat(fill.qty),
      price: parseFloat(fill.price),
      commission: parseFloat(fill.commission)
    }))
  };
}

export async function cancelAll(symbol?: string): Promise<boolean> {
  try {
    const params: Record<string, any> = {};
    if (symbol) {
      params.symbol = symbol;
    }

    await makeRequest('/api/v3/openOrders', params, 'DELETE');
    return true;
  } catch (error) {
    console.error('Failed to cancel orders:', error);
    return false;
  }
}

export async function getOpenOrders(symbol?: string): Promise<OrderResponse[]> {
  const params: Record<string, any> = {};
  if (symbol) {
    params.symbol = symbol;
  }

  const orders = await makeRequest('/api/v3/openOrders', params);
  
  return orders.map((order: any) => ({
    orderId: order.orderId.toString(),
    clientOrderId: order.clientOrderId,
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    qty: parseFloat(order.origQty),
    price: parseFloat(order.price),
    status: order.status
  }));
}

export async function getAccount(): Promise<AccountInfo> {
  const result = await makeRequest('/api/v3/account');
  
  return {
    balances: result.balances.map((balance: any) => ({
      asset: balance.asset,
      free: balance.free,
      locked: balance.locked
    }))
  };
}

export async function getTicker(symbol: string): Promise<TickerInfo> {
  const result = await makeRequest('/api/v3/ticker/24hr', { symbol });
  
  return {
    symbol: result.symbol,
    price: result.lastPrice,
    volume: result.volume
  };
}

export async function getOrder(orderId: string, symbol: string): Promise<OrderResponse | null> {
  try {
    const result = await makeRequest('/api/v3/order', { orderId, symbol });
    
    return {
      orderId: result.orderId.toString(),
      clientOrderId: result.clientOrderId,
      symbol: result.symbol,
      side: result.side,
      type: result.type,
      qty: parseFloat(result.origQty),
      price: parseFloat(result.price),
      status: result.status,
      fills: result.fills?.map((fill: any) => ({
        qty: parseFloat(fill.qty),
        price: parseFloat(fill.price),
        commission: parseFloat(fill.commission)
      }))
    };
  } catch (error) {
    console.error('Failed to get order:', error);
    return null;
  }
} 