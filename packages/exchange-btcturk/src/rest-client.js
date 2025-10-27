import crypto from 'crypto';
export class BTCTurkRESTClient {
    config;
    baseUrl;
    timeout;
    constructor(config) {
        this.config = config;
        this.baseUrl = config.baseUrl || 'https://api.btcturk.com/api/v2';
        this.timeout = config.timeout || 10000;
    }
    async makeRequest(method, endpoint, data, signed = false) {
        const url = `${this.baseUrl}${endpoint}`;
        const timestamp = Date.now().toString();
        let headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'spark-trading-platform/1.0',
            'X-Requested-With': 'XMLHttpRequest'
        };
        if (signed) {
            const message = timestamp + method.toUpperCase() + endpoint + (data ? JSON.stringify(data) : '');
            const signature = crypto
                .createHmac('sha256', this.config.apiSecret)
                .update(message)
                .digest('base64');
            headers['X-PCK'] = this.config.apiKey;
            headers['X-Stamp'] = timestamp;
            headers['X-Signature'] = signature;
        }
        const options = {
            method,
            headers,
            signal: AbortSignal.timeout(this.timeout)
        };
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            throw new Error(`BTCTurk API request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getServerTime() {
        const response = await this.makeRequest('GET', '/server/time');
        return response.serverTime;
    }
    async getSymbols() {
        const response = await this.makeRequest('GET', '/server/exchangeinfo');
        return response.data || [];
    }
    async getTicker(symbol) {
        const endpoint = symbol ? `/ticker?pairSymbol=${symbol}` : '/ticker';
        const response = await this.makeRequest('GET', endpoint);
        return response.data || [];
    }
    async getTrades(symbol, limit = 50) {
        const response = await this.makeRequest('GET', `/trades?pairSymbol=${symbol}&last=${limit}`);
        return response.data || [];
    }
    async getOrderBook(symbol, limit = 100) {
        const response = await this.makeRequest('GET', `/orderbook?pairSymbol=${symbol}&limit=${limit}`);
        return response.data;
    }
    async getKlines(symbol, interval = '1h', startTime, endTime, limit = 500) {
        let endpoint = `/klines?pairSymbol=${symbol}&interval=${interval}&limit=${limit}`;
        if (startTime)
            endpoint += `&startTime=${startTime}`;
        if (endTime)
            endpoint += `&endTime=${endTime}`;
        const response = await this.makeRequest('GET', endpoint);
        return response.data || [];
    }
    async getAccount() {
        const response = await this.makeRequest('GET', '/users/balances', undefined, true);
        return response.data || [];
    }
    async getOpenOrders(symbol) {
        const endpoint = symbol ? `/openOrders?pairSymbol=${symbol}` : '/openOrders';
        const response = await this.makeRequest('GET', endpoint, undefined, true);
        return response.data || [];
    }
    async placeOrder(order) {
        const response = await this.makeRequest('POST', '/order', order, true);
        return response.data;
    }
    async cancelOrder(symbol, orderId) {
        const response = await this.makeRequest('DELETE', `/order?id=${orderId}&pairSymbol=${symbol}`, undefined, true);
        return response.data;
    }
    async getOrder(symbol, orderId) {
        const response = await this.makeRequest('GET', `/order?id=${orderId}&pairSymbol=${symbol}`, undefined, true);
        return response.data;
    }
}
//# sourceMappingURL=rest-client.js.map