import { EventEmitter } from 'events';
import { BTCTurkConfig } from './types.js';
export declare class BTCTurkWSClient extends EventEmitter {
    private config;
    private wsUrl;
    private ws;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private maxReconnectDelay;
    private heartbeatInterval;
    private isConnected;
    private subscribedChannels;
    constructor(config: BTCTurkConfig);
    connect(): Promise<void>;
    private handleMessage;
    private startHeartbeat;
    private stopHeartbeat;
    private scheduleReconnect;
    subscribeTicker(symbol: string): void;
    subscribeTrades(symbol: string): void;
    subscribeOrderBook(symbol: string): void;
    private subscribe;
    unsubscribe(channel: string): void;
    disconnect(): void;
    getConnectionStatus(): {
        connected: boolean;
        channels: string[];
    };
}
//# sourceMappingURL=ws-client.d.ts.map