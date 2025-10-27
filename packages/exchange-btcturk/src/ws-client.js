import WebSocket from 'ws';
import { EventEmitter } from 'events';
export class BTCTurkWSClient extends EventEmitter {
    config;
    wsUrl;
    ws = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    reconnectDelay = 1000;
    maxReconnectDelay = 30000;
    heartbeatInterval = null;
    isConnected = false;
    subscribedChannels = new Set();
    constructor(config) {
        super();
        this.config = config;
        this.wsUrl = config.wsUrl || 'wss://ws-feed.btcturk.com';
    }
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.wsUrl);
                this.ws.on('open', () => {
                    console.log('BTCTurk WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.emit('connected');
                    resolve();
                });
                this.ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleMessage(message);
                    }
                    catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                });
                this.ws.on('close', (code, reason) => {
                    console.log(`BTCTurk WebSocket closed: ${code} ${reason}`);
                    this.isConnected = false;
                    this.stopHeartbeat();
                    this.emit('disconnected', { code, reason });
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                });
                this.ws.on('error', (error) => {
                    console.error('BTCTurk WebSocket error:', error);
                    this.emit('error', error);
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    handleMessage(message) {
        this.emit('message', message);
        switch (message.type) {
            case 'ticker':
                this.emit('ticker', message.data);
                break;
            case 'trade':
                this.emit('trade', message.data);
                break;
            case 'orderbook':
                this.emit('orderbook', message.data);
                break;
            case 'pong':
                // Heartbeat response
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.ws) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // 30 seconds
    }
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
        console.log(`Reconnecting to BTCTurk WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }
    subscribeTicker(symbol) {
        const channel = `ticker_${symbol}`;
        this.subscribe(channel, { type: 'ticker', pairSymbol: symbol });
    }
    subscribeTrades(symbol) {
        const channel = `trades_${symbol}`;
        this.subscribe(channel, { type: 'trades', pairSymbol: symbol });
    }
    subscribeOrderBook(symbol) {
        const channel = `orderbook_${symbol}`;
        this.subscribe(channel, { type: 'orderbook', pairSymbol: symbol });
    }
    subscribe(channel, message) {
        if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify(message));
            this.subscribedChannels.add(channel);
            console.log(`Subscribed to ${channel}`);
        }
    }
    unsubscribe(channel) {
        if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
            this.subscribedChannels.delete(channel);
            console.log(`Unsubscribed from ${channel}`);
        }
    }
    disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.subscribedChannels.clear();
    }
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            channels: Array.from(this.subscribedChannels)
        };
    }
}
//# sourceMappingURL=ws-client.js.map