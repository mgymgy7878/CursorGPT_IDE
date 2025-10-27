export interface StreamEvent {
  id: string;
  tsSource: number;
  tsIngest: number;
  src: string;
  symbol: string;
  seq: number;
  type: 'trade' | 'orderbook' | 'kline' | 'heartbeat';
  payload: any;
  payloadHash: string;
}

export interface StreamMetrics {
  messagesTotal: number;
  seqGapTotal: number;
  dupTotal: number;
  outOfOrderTotal: number;
  ingestLagSeconds: number;
  lastSeq: number;
  eventToDbMs: number;
  wsRoundtripMs: number;
}

export interface StreamConnector {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getLastHeartbeat(): number;
}

export interface ChaosConfig {
  mode: 'lag' | 'gap' | 'drop';
  duration: number;
  intensity: number;
} 