export * from './types.js';
export * from './rest-client.js';
export * from './ws-client.js';
import { BTCTurkRESTClient } from './rest-client.js';
import { BTCTurkWSClient } from './ws-client.js';
export class BTCTurkExchange {
    restClient;
    wsClient;
    metrics;
    constructor(config) {
        this.restClient = new BTCTurkRESTClient(config);
        this.wsClient = new BTCTurkWSClient(config);
        this.metrics = {
            httpRequestsTotal: 0,
            wsMessagesTotal: 0,
            wsDisconnectsTotal: 0,
            clockSkewSeconds: 0,
            lastUpdate: Date.now()
        };
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.wsClient.on('message', () => {
            this.metrics.wsMessagesTotal++;
            this.metrics.lastUpdate = Date.now();
        });
        this.wsClient.on('disconnected', () => {
            this.metrics.wsDisconnectsTotal++;
        });
        // Update clock skew periodically
        setInterval(async () => {
            try {
                const serverTime = await this.restClient.getServerTime();
                const localTime = Date.now();
                this.metrics.clockSkewSeconds = (serverTime - localTime) / 1000;
            }
            catch (error) {
                console.error('Failed to update clock skew:', error);
            }
        }, 60000); // Every minute
    }
    // REST API methods
    async getServerTime() {
        this.metrics.httpRequestsTotal++;
        return this.restClient.getServerTime();
    }
    async getSymbols() {
        this.metrics.httpRequestsTotal++;
        return this.restClient.getSymbols();
    }
    async getTicker(symbol) {
        this.metrics.httpRequestsTotal++;
        return this.restClient.getTicker(symbol);
    }
    async getTrades(symbol, limit) {
        this.metrics.httpRequestsTotal++;
        return this.restClient.getTrades(symbol, limit);
    }
    async getOrderBook(symbol, limit) {
        this.metrics.httpRequestsTotal++;
        return this.restClient.getOrderBook(symbol, limit);
    }
    async getKlines(symbol, interval, startTime, endTime, limit) {
        this.metrics.httpRequestsTotal++;
        return this.restClient.getKlines(symbol, interval, startTime, endTime, limit);
    }
    async getAccount() {
        this.metrics.httpRequestsTotal++;
        return this.restClient.getAccount();
    }
    async getOpenOrders(symbol) {
        this.metrics.httpRequestsTotal++;
        return this.restClient.getOpenOrders(symbol);
    }
    async placeOrder(order) {
        this.metrics.httpRequestsTotal++;
        return this.restClient.placeOrder(order);
    }
    async cancelOrder(symbol, orderId) {
        this.metrics.httpRequestsTotal++;
        return this.restClient.cancelOrder(symbol, orderId);
    }
    async getOrder(symbol, orderId) {
        this.metrics.httpRequestsTotal++;
        return this.restClient.getOrder(symbol, orderId);
    }
    // WebSocket methods
    async connectWS() {
        return this.wsClient.connect();
    }
    subscribeTicker(symbol) {
        this.wsClient.subscribeTicker(symbol);
    }
    subscribeTrades(symbol) {
        this.wsClient.subscribeTrades(symbol);
    }
    subscribeOrderBook(symbol) {
        this.wsClient.subscribeOrderBook(symbol);
    }
    unsubscribe(channel) {
        this.wsClient.unsubscribe(channel);
    }
    disconnectWS() {
        this.wsClient.disconnect();
    }
    getWSStatus() {
        return this.wsClient.getConnectionStatus();
    }
    // Event handling
    on(event, listener) {
        this.wsClient.on(event, listener);
        return this;
    }
    off(event, listener) {
        this.wsClient.off(event, listener);
        return this;
    }
    // Metrics
    getMetrics() {
        return { ...this.metrics };
    }
    // Health check
    async healthCheck() {
        try {
            const serverTime = await this.getServerTime();
            const wsStatus = this.getWSStatus();
            return {
                status: 'healthy',
                metrics: this.getMetrics(),
                wsStatus
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                metrics: this.getMetrics(),
                wsStatus: this.getWSStatus()
            };
        }
    }
}
//# sourceMappingURL=index.js.map